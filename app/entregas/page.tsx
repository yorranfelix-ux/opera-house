'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

interface ClienteEntrega {
  nome: string
  cidade: string
  estado: string
  endereco: string
  numero: string
  bairro: string
  cep: string
}

interface Entrega {
  id: string
  pedido_id: string
  data_agendada: string
  data_realizada: string
  status: string
  requer_icamento: boolean
  observacoes_icamento: string
  observacoes: string
  pedidos: {
    numero_pedido: string
    clientes: ClienteEntrega
  }
}

interface Pedido {
  id: string
  numero_pedido: string
  clientes: { nome: string; cidade: string }
}

const STATUS_COR: Record<string, { bg: string; color: string; label: string }> = {
  agendada: { bg: '#E6F1FB', color: '#0C447C', label: 'Agendada' },
  realizada: { bg: '#EAF3DE', color: '#27500A', label: 'Realizada' },
  reagendada: { bg: '#FAEEDA', color: '#633806', label: 'Reagendada' },
  cancelada: { bg: '#f0efe9', color: '#888', label: 'Cancelada' },
}

const STATUS_LISTA = ['agendada', 'realizada', 'reagendada', 'cancelada']

const formVazio = {
  pedido_id: '', data_agendada: '', data_realizada: '',
  status: 'agendada', requer_icamento: false,
  observacoes_icamento: '', observacoes: '',
}

function montarEnderecoCliente(c: ClienteEntrega): string {
  return [c.endereco, c.numero, c.bairro, c.cidade, c.estado, c.cep]
    .filter(Boolean).join(', ')
}

function abrirRotaMaps(entregas: Entrega[]) {
  const enderecos = entregas
    .map(e => montarEnderecoCliente(e.pedidos?.clientes))
    .filter(Boolean)
  if (enderecos.length === 0) return alert('Nenhum endereço cadastrado para os clientes deste dia.')
  const url = 'https://www.google.com/maps/dir/' + enderecos.map(e => encodeURIComponent(e)).join('/')
  window.open(url, '_blank')
}

function formatarDataLabel(dataStr: string): string {
  const d = new Date(dataStr + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function Entregas() {
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filtro, setFiltro] = useState<'pendentes' | 'realizadas' | 'todas'>('pendentes')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState(formVazio)

  useEffect(() => {
    buscarEntregas()
    buscarPedidos()
  }, [])

  async function buscarEntregas() {
    const { data } = await supabase
      .from('entregas')
      .select('*, pedidos(numero_pedido, clientes(nome, cidade, estado, endereco, numero, bairro, cep))')
      .order('data_agendada', { ascending: true })
    setEntregas((data as unknown as Entrega[]) || [])
  }

  async function buscarPedidos() {
    const { data } = await supabase
      .from('pedidos')
      .select('id, numero_pedido, clientes(nome, cidade)')
      .not('status', 'in', '(entregue,cancelado)')
      .order('numero_pedido', { ascending: false })
    setPedidos((data as unknown as Pedido[]) || [])
  }

  function abrirNovo() {
    setEditandoId(null)
    setForm(formVazio)
    setShowForm(true)
  }

  function abrirEdicao(e: Entrega) {
    setEditandoId(e.id)
    setForm({
      pedido_id: e.pedido_id || '',
      data_agendada: e.data_agendada || '',
      data_realizada: e.data_realizada || '',
      status: e.status || 'agendada',
      requer_icamento: e.requer_icamento || false,
      observacoes_icamento: e.observacoes_icamento || '',
      observacoes: e.observacoes || '',
    })
    setShowForm(true)
  }

  async function salvar() {
    if (!form.pedido_id) return alert('Selecione o pedido')
    if (!form.data_agendada) return alert('Data agendada é obrigatória')
    const payload = {
      pedido_id: form.pedido_id,
      data_agendada: form.data_agendada,
      data_realizada: form.data_realizada || null,
      status: form.status,
      requer_icamento: form.requer_icamento,
      observacoes_icamento: form.observacoes_icamento,
      observacoes: form.observacoes,
    }
    if (editandoId) {
      const { error } = await supabase.from('entregas').update(payload).eq('id', editandoId)
      if (error) return alert('Erro: ' + error.message)
    } else {
      const { error } = await supabase.from('entregas').insert([{ ...payload, status: 'agendada' }])
      if (error) return alert('Erro: ' + error.message)
    }
    setShowForm(false)
    setForm(formVazio)
    setEditandoId(null)
    buscarEntregas()
  }

  const filtradas = entregas.filter(e => {
    if (filtro === 'pendentes') return e.status === 'agendada' || e.status === 'reagendada'
    if (filtro === 'realizadas') return e.status === 'realizada'
    return true
  })

  // Agrupar por data
  const porDia = filtradas.reduce<Record<string, Entrega[]>>((acc, e) => {
    const d = e.data_agendada || 'sem-data'
    if (!acc[d]) acc[d] = []
    acc[d].push(e)
    return acc
  }, {})
  const diasOrdenados = Object.keys(porDia).sort()

  const hoje = new Date().toISOString().split('T')[0]

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#f7f6f3' }}>
      <Sidebar ativa="/entregas" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: '52px', background: '#fff', borderBottom: '0.5px solid #e8e7e3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', flexShrink: 0 }}>
          <span style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a2e' }}>Programação de Entregas</span>
          <button onClick={abrirNovo} style={{ background: '#1a1a2e', color: '#C9A84C', border: 'none', padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
            + Agendar entrega
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          <div style={{ display: 'flex', gap: '4px', background: '#fff', border: '0.5px solid #e8e7e3', borderRadius: '8px', padding: '3px', width: 'fit-content', marginBottom: '20px' }}>
            {([
              { key: 'pendentes', label: 'Pendentes' },
              { key: 'realizadas', label: 'Realizadas' },
              { key: 'todas', label: 'Todas' },
            ] as const).map(op => (
              <button
                key={op.key}
                onClick={() => setFiltro(op.key)}
                style={{ padding: '5px 16px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: '500', cursor: 'pointer', background: filtro === op.key ? '#1a1a2e' : 'transparent', color: filtro === op.key ? '#C9A84C' : '#888' }}
              >
                {op.label}
              </button>
            ))}
          </div>

          {diasOrdenados.length === 0 && (
            <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', padding: '40px', textAlign: 'center', color: '#888', fontSize: '13px' }}>
              Nenhuma entrega agendada.
            </div>
          )}

          {diasOrdenados.map(dia => {
            const entregasDia = porDia[dia]
            const atrasado = dia < hoje && entregasDia.some(e => e.status === 'agendada' || e.status === 'reagendada')
            const temEndereco = entregasDia.some(e => e.pedidos?.clientes?.endereco)

            return (
              <div key={dia} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: atrasado ? '#A32D2D' : '#1a1a2e', textTransform: 'capitalize' }}>
                      {formatarDataLabel(dia)}
                    </span>
                    {atrasado && (
                      <span style={{ fontSize: '10px', background: '#FCEBEB', color: '#791F1F', padding: '2px 8px', borderRadius: '6px', fontWeight: '500' }}>Atrasado</span>
                    )}
                    <span style={{ fontSize: '11px', color: '#aaa' }}>{entregasDia.length} entrega{entregasDia.length !== 1 ? 's' : ''}</span>
                  </div>
                  <button
                    onClick={() => abrirRotaMaps(entregasDia)}
                    title={temEndereco ? 'Abrir rota no Google Maps' : 'Cadastre os endereços dos clientes para usar esta função'}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '7px', border: '0.5px solid #C9A84C', background: '#fff', color: '#C9A84C', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}
                  >
                    <span>📍</span> Abrir rota no Maps
                  </button>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
                  {entregasDia.map((e, i) => {
                    const c = e.pedidos?.clientes
                    const enderecoCompleto = c ? montarEnderecoCliente(c) : ''
                    return (
                      <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderTop: i > 0 ? '0.5px solid #f0efe9' : 'none', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '11px', color: '#C9A84C', fontWeight: '600' }}>
                          {i + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>Pedido {e.pedidos?.numero_pedido}</span>
                            <span style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '6px', fontWeight: '500', background: STATUS_COR[e.status]?.bg || '#f0efe9', color: STATUS_COR[e.status]?.color || '#555' }}>
                              {STATUS_COR[e.status]?.label || e.status}
                            </span>
                            {e.requer_icamento && (
                              <span style={{ fontSize: '10px', background: '#FAEEDA', color: '#633806', padding: '1px 6px', borderRadius: '6px', fontWeight: '500' }}>Içamento</span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#555' }}>{c?.nome}</div>
                          {enderecoCompleto ? (
                            <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{enderecoCompleto}</div>
                          ) : (
                            <div style={{ fontSize: '11px', color: '#bbb', marginTop: '2px' }}>{c?.cidade} {c?.estado} — endereço completo não cadastrado</div>
                          )}
                          {e.observacoes && (
                            <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px', fontStyle: 'italic' }}>{e.observacoes}</div>
                          )}
                        </div>
                        <button
                          onClick={() => abrirEdicao(e)}
                          style={{ padding: '5px 12px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#555', whiteSpace: 'nowrap' }}
                        >
                          Editar
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '480px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a2e' }}>{editandoId ? 'Editar entrega' : 'Agendar entrega'}</span>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Pedido *</div>
              <select value={form.pedido_id} onChange={e => setForm({ ...form, pedido_id: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                <option value="">Selecione o pedido</option>
                {pedidos.map(p => <option key={p.id} value={p.id}>{p.numero_pedido} — {(p.clientes as any)?.nome}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Data da entrega *</div>
              <input type="date" value={form.data_agendada} onChange={e => setForm({ ...form, data_agendada: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {editandoId && (
              <>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Status</div>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                    {STATUS_LISTA.map(s => <option key={s} value={s}>{STATUS_COR[s]?.label || s}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Data realizada</div>
                  <input type="date" value={form.data_realizada} onChange={e => setForm({ ...form, data_realizada: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </>
            )}

            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="icamento" checked={form.requer_icamento} onChange={e => setForm({ ...form, requer_icamento: e.target.checked })} />
              <label htmlFor="icamento" style={{ fontSize: '13px', color: '#555', cursor: 'pointer' }}>Requer içamento</label>
            </div>

            {form.requer_icamento && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Observações de içamento</div>
                <textarea value={form.observacoes_icamento} onChange={e => setForm({ ...form, observacoes_icamento: e.target.value })} rows={2}
                  placeholder="Ex: 3º andar, sem elevador..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Observações</div>
              <textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={2}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
              <button onClick={salvar} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#1a1a2e', color: '#C9A84C', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                {editandoId ? 'Salvar alterações' : 'Agendar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
