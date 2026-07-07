'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

interface Registro {
  id: string
  created_at: string
  tipo: string
  descricao: string
  usuario_nome: string
  pedido_id: string
  item_id: string | null
  pedidos: { numero_pedido: string; clientes: { nome: string } }
}

const TIPO_COR: Record<string, { bg: string; color: string; label: string }> = {
  item_adicionado:       { bg: '#EAF3DE', color: '#27500A', label: 'Item adicionado' },
  item_editado:          { bg: '#E6F1FB', color: '#0C447C', label: 'Item editado' },
  pedido_criado:         { bg: '#EEEDFE', color: '#3C3489', label: 'Pedido criado' },
  pedido_editado:        { bg: '#FAEEDA', color: '#633806', label: 'Pedido editado' },
  pedido_excluido:       { bg: '#FCEBEB', color: '#791F1F', label: 'Pedido excluído' },
  at_criada:             { bg: '#EAF3DE', color: '#27500A', label: 'AT criada' },
  at_atualizada:         { bg: '#E6F1FB', color: '#0C447C', label: 'AT atualizada' },
  at_excluida:           { bg: '#FCEBEB', color: '#791F1F', label: 'AT excluída' },
  ocorrencia_criada:     { bg: '#FAEEDA', color: '#633806', label: 'Ocorrência aberta' },
  ocorrencia_editada:    { bg: '#E6F1FB', color: '#0C447C', label: 'Ocorrência editada' },
  ocorrencia_excluida:   { bg: '#FCEBEB', color: '#791F1F', label: 'Ocorrência excluída' },
  cliente_criado:        { bg: '#EAF3DE', color: '#27500A', label: 'Cliente cadastrado' },
  cliente_editado:       { bg: '#E6F1FB', color: '#0C447C', label: 'Cliente editado' },
  fornecedor_criado:     { bg: '#EAF3DE', color: '#27500A', label: 'Fornecedor cadastrado' },
  fornecedor_editado:    { bg: '#E6F1FB', color: '#0C447C', label: 'Fornecedor editado' },
  profissional_criado:   { bg: '#EAF3DE', color: '#27500A', label: 'Profissional cadastrado' },
  profissional_editado:  { bg: '#E6F1FB', color: '#0C447C', label: 'Profissional editado' },
  cliente_excluido:      { bg: '#FCEBEB', color: '#791F1F', label: 'Cliente excluído' },
  fornecedor_excluido:   { bg: '#FCEBEB', color: '#791F1F', label: 'Fornecedor excluído' },
  profissional_excluido: { bg: '#FCEBEB', color: '#791F1F', label: 'Profissional excluído' },
  entrega_agendada:      { bg: '#EAF3DE', color: '#27500A', label: 'Entrega agendada' },
  entrega_atualizada:    { bg: '#E6F1FB', color: '#0C447C', label: 'Entrega atualizada' },
  entrega_excluida:      { bg: '#FCEBEB', color: '#791F1F', label: 'Entrega removida' },
}

export default function Historico() {
  const [registros, setRegistros] = useState<Registro[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroPedido, setFiltroPedido] = useState('')
  const [pedidos, setPedidos] = useState<{ id: string; numero_pedido: string }[]>([])

  useEffect(() => {
    buscarRegistros()
    buscarPedidos()
  }, [])

  async function buscarRegistros() {
    setLoading(true)
    const { data } = await supabase
      .from('historico_alteracoes')
      .select('*, pedidos(numero_pedido, clientes(nome))')
      .order('created_at', { ascending: false })
      .limit(200)
    setRegistros((data as unknown as Registro[]) || [])
    setLoading(false)
  }

  async function buscarPedidos() {
    const { data } = await supabase.from('pedidos').select('id, numero_pedido').order('numero_pedido', { ascending: false })
    setPedidos(data || [])
  }

  const filtrados = registros.filter(r => {
    const buscaOk = !busca ||
      r.pedidos?.numero_pedido?.includes(busca) ||
      r.pedidos?.clientes?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      r.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
      r.usuario_nome?.toLowerCase().includes(busca.toLowerCase())
    const pedidoOk = !filtroPedido || r.pedido_id === filtroPedido
    return buscaOk && pedidoOk
  })

  // Agrupar por data
  const porDia = filtrados.reduce<Record<string, Registro[]>>((acc, r) => {
    const dia = new Date(r.created_at).toLocaleDateString('pt-BR')
    if (!acc[dia]) acc[dia] = []
    acc[dia].push(r)
    return acc
  }, {})
  const dias = Object.keys(porDia).sort((a, b) => {
    const toISO = (d: string) => d.split('/').reverse().join('-')
    return toISO(b).localeCompare(toISO(a))
  })

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#f7f6f3' }}>
      <Sidebar ativa="/historico" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: '52px', background: '#fff', borderBottom: '0.5px solid #e8e7e3', display: 'flex', alignItems: 'center', padding: '0 22px', fontSize: '15px', fontWeight: '500', color: '#1a1a2e', flexShrink: 0 }}>
          Histórico de alterações
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <input
              placeholder="Buscar por pedido, usuário ou descrição..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ width: '300px', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none' }}
            />
            <select
              value={filtroPedido}
              onChange={e => setFiltroPedido(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', color: filtroPedido ? '#1a1a2e' : '#888' }}
            >
              <option value="">Todos os pedidos</option>
              {pedidos.map(p => <option key={p.id} value={p.id}>Pedido {p.numero_pedido}</option>)}
            </select>
            {(busca || filtroPedido) && (
              <button onClick={() => { setBusca(''); setFiltroPedido('') }}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#888' }}>
                Limpar filtros
              </button>
            )}
            <span style={{ fontSize: '12px', color: '#aaa', alignSelf: 'center' }}>{filtrados.length} registro{filtrados.length !== 1 ? 's' : ''}</span>
          </div>

          {registros.length === 200 && !loading && (
            <div style={{ background: '#FAEEDA', border: '0.5px solid #f0d4a0', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '12px', color: '#633806' }}>
              Exibindo os 200 registros mais recentes. Use os filtros para localizar registros mais antigos.
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', color: '#888', fontSize: '13px', padding: '40px' }}>Carregando...</div>
          )}

          {!loading && filtrados.length === 0 && (
            <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', padding: '40px', textAlign: 'center', color: '#888', fontSize: '13px' }}>
              Nenhum registro encontrado.
            </div>
          )}

          {dias.map(dia => (
            <div key={dia} style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', paddingLeft: '4px' }}>
                {dia}
              </div>
              <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
                {porDia[dia].map((r, i) => (
                  <div key={r.id} style={{ display: 'flex', gap: '14px', padding: '12px 16px', borderTop: i > 0 ? '0.5px solid #f0efe9' : 'none', alignItems: 'flex-start' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '12px', color: '#C9A84C', fontWeight: '600' }}>
                      {r.usuario_nome?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                        {r.pedidos?.numero_pedido ? (
                          <a href={`/pedidos/${r.pedido_id}`} style={{ fontSize: '12px', fontWeight: '600', color: '#C9A84C', textDecoration: 'none' }}>
                            Pedido {r.pedidos.numero_pedido}
                          </a>
                        ) : null}
                        {r.pedidos?.clientes?.nome && (
                          <span style={{ fontSize: '11px', color: '#888' }}>· {r.pedidos.clientes.nome}</span>
                        )}
                        {r.tipo && (
                          <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '6px', fontWeight: '500', background: TIPO_COR[r.tipo]?.bg || '#f0efe9', color: TIPO_COR[r.tipo]?.color || '#555' }}>
                            {TIPO_COR[r.tipo]?.label || r.tipo}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', color: '#1a1a2e', marginBottom: '2px' }}>{r.descricao}</div>
                      <div style={{ fontSize: '11px', color: '#aaa' }}>
                        {r.usuario_nome} · {new Date(r.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
