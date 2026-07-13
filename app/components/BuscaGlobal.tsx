'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Estado global simples para abrir/fechar o modal de qualquer lugar
let _setBuscaAberta: ((v: boolean) => void) | null = null
export function abrirBuscaGlobal() { _setBuscaAberta?.(true) }

interface ResultadoItem {
  id: string | number
  titulo: string
  detalhe?: string
  url: string
  _status?: string
}

interface GrupoResultado {
  label: string
  items: ResultadoItem[]
}

function usarDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

function BuscaModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [grupos, setGrupos] = useState<GrupoResultado[]>([])
  const [carregando, setCarregando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const q = usarDebounce(query, 250)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (q.length < 2) {
      setGrupos([])
      return
    }
    let cancelado = false
    setCarregando(true)

    async function buscar() {
      const [pedidosRes, clientesRes, fornecedoresRes, atsRes] = await Promise.all([
        supabase
          .from('pedidos')
          .select('id, numero_pedido, status, clientes(nome, cidade)')
          .or(`numero_pedido.ilike.%${q}%`)
          .limit(5),
        supabase
          .from('clientes')
          .select('id, nome, cidade')
          .or(`nome.ilike.%${q}%,cidade.ilike.%${q}%`)
          .limit(5),
        supabase
          .from('fornecedores')
          .select('id, nome_fantasia, razao_social')
          .or(`nome_fantasia.ilike.%${q}%,razao_social.ilike.%${q}%`)
          .limit(5),
        supabase
          .from('assistencias_tecnicas')
          .select('id, numero_at, descricao_problema, pedidos(numero_pedido, clientes(nome))')
          .or(`numero_at.ilike.%${q}%,descricao_problema.ilike.%${q}%`)
          .limit(4),
      ])

      if (cancelado) return

      if (pedidosRes.error) console.error('BuscaGlobal pedidos:', pedidosRes.error)
      if (clientesRes.error) console.error('BuscaGlobal clientes:', clientesRes.error)
      if (fornecedoresRes.error) console.error('BuscaGlobal fornecedores:', fornecedoresRes.error)
      if (atsRes.error) console.error('BuscaGlobal ATs:', atsRes.error)

      const novosGrupos: GrupoResultado[] = []

      if (pedidosRes.data && pedidosRes.data.length > 0) {
        novosGrupos.push({
          label: 'Pedidos',
          items: pedidosRes.data.map((p: any) => {
            const cliente = Array.isArray(p.clientes) ? p.clientes[0] : p.clientes
            return {
              id: p.id,
              titulo: `Pedido ${p.numero_pedido}`,
              detalhe: cliente ? `${cliente.nome} · ${cliente.cidade}` : undefined,
              url: `/pedidos/${p.id}`,
              _status: p.status,
            }
          }),
        })
      }

      if (clientesRes.data && clientesRes.data.length > 0) {
        novosGrupos.push({
          label: 'Clientes',
          items: clientesRes.data.map((c: any) => ({
            id: c.id,
            titulo: c.nome,
            detalhe: c.cidade,
            url: '/clientes',
          })),
        })
      }

      if (fornecedoresRes.data && fornecedoresRes.data.length > 0) {
        novosGrupos.push({
          label: 'Fornecedores',
          items: fornecedoresRes.data.map((f: any) => ({
            id: f.id,
            titulo: f.nome_fantasia || f.razao_social,
            url: '/fornecedores',
          })),
        })
      }

      if (atsRes.data && atsRes.data.length > 0) {
        novosGrupos.push({
          label: 'AT',
          items: atsRes.data.map((at: any) => {
            const pedido = Array.isArray(at.pedidos) ? at.pedidos[0] : at.pedidos
            const detalhePartes = []
            if (pedido) detalhePartes.push(`Pedido ${pedido.numero_pedido}`)
            if (at.descricao_problema) detalhePartes.push(at.descricao_problema.substring(0, 60) + (at.descricao_problema.length > 60 ? '…' : ''))
            return {
              id: at.id,
              titulo: at.numero_at,
              detalhe: detalhePartes.join(' · ') || undefined,
              url: `/assistencia/${at.id}`,
            }
          }),
        })
      }

      setGrupos(novosGrupos)
      setCarregando(false)
    }

    buscar()
    return () => { cancelado = true }
  }, [q])

  const temResultados = grupos.some(g => g.items.length > 0)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '80px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '520px',
          background: '#fff',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        }}
      >
        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '0.5px solid #f0efe9', gap: '10px' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="6" cy="6" r="4"/><line x1="9.5" y1="9.5" x2="13" y2="13"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar pedidos, clientes, fornecedores..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              color: '#1a1a2e',
              background: 'transparent',
              fontFamily: 'sans-serif',
            }}
          />
        </div>

        {/* Resultados */}
        {q.length >= 2 && (
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {carregando && (
              <div style={{ fontSize: '13px', color: '#888', padding: '24px', textAlign: 'center', fontFamily: 'sans-serif' }}>
                Buscando...
              </div>
            )}
            {!carregando && !temResultados && (
              <div style={{ fontSize: '13px', color: '#888', padding: '24px', textAlign: 'center', fontFamily: 'sans-serif' }}>
                Nenhum resultado encontrado.
              </div>
            )}
            {!carregando && grupos.map(grupo => (
              <div key={grupo.label}>
                <div style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#aaa',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  padding: '6px 16px',
                  fontFamily: 'sans-serif',
                }}>
                  {grupo.label}
                </div>
                {grupo.items.map(item => (
                  <div
                    key={item.id}
                    onClick={() => { window.location.href = item.url; onClose() }}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'center',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f7f6f3' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', color: '#1a1a2e', fontFamily: 'sans-serif' }}>{item.titulo}</span>
                        {item._status === 'entregue' && (
                          <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '5px', background: '#EAF3DE', color: '#27500A', fontWeight: '500', fontFamily: 'sans-serif' }}>entregue</span>
                        )}
                        {item._status === 'cancelado' && (
                          <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '5px', background: '#f0efe9', color: '#888', fontWeight: '500', fontFamily: 'sans-serif' }}>cancelado</span>
                        )}
                      </div>
                      {item.detalhe && (
                        <div style={{ fontSize: '11px', color: '#888', fontFamily: 'sans-serif' }}>{item.detalhe}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{
          fontSize: '10px',
          color: '#bbb',
          padding: '8px 16px',
          borderTop: '0.5px solid #f0efe9',
          fontFamily: 'sans-serif',
        }}>
          ↵ para abrir · Esc para fechar
        </div>
      </div>
    </div>
  )
}

export default function BuscaGlobal() {
  const [aberta, setAberta] = useState(false)

  // registrar setter global
  useEffect(() => {
    _setBuscaAberta = setAberta
    return () => { _setBuscaAberta = null }
  }, [])

  // listener Ctrl+K
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setAberta(a => !a)
      }
      if (e.key === 'Escape') setAberta(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!aberta) return null
  return <BuscaModal onClose={() => setAberta(false)} />
}
