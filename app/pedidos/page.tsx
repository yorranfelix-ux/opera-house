'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { registrarHistorico } from '../lib/historico'
import Sidebar from '../components/Sidebar'

interface Pedido {
  id: string
  numero_pedido: string
  cliente_id: string
  profissional_id: string
  data_venda: string
  prazo_prometido: string
  data_entrega: string | null
  status: string
  semaforo: string
  observacoes_gerais: string
  clientes: { nome: string; cidade: string; estado: string }
  profissionais: { nome: string; tipo: string } | null
}

const STATUS_LABEL: Record<string, string> = {
  criado: 'Criado',
  aguardando_compra: 'Aguard. compra',
  em_producao: 'Em produção',
  em_transporte: 'Em transporte',
  recebido: 'Recebido',
  apto_agendamento: 'Apto agendar',
  agendado: 'Agendado',
  entregue: 'Entregue',
  com_at: 'Com AT',
  cancelado: 'Cancelado',
}

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  criado: { bg: '#f0efe9', color: '#555' },
  aguardando_compra: { bg: '#FAECE7', color: '#712B13' },
  em_producao: { bg: '#E6F1FB', color: '#0C447C' },
  em_transporte: { bg: '#FAEEDA', color: '#633806' },
  recebido: { bg: '#EAF3DE', color: '#27500A' },
  apto_agendamento: { bg: '#EAF3DE', color: '#27500A' },
  agendado: { bg: '#EEEDFE', color: '#3C3489' },
  entregue: { bg: '#EAF3DE', color: '#27500A' },
  com_at: { bg: '#EEEDFE', color: '#3C3489' },
  cancelado: { bg: '#FCEBEB', color: '#791F1F' },
}

const SEMAFORO_COLOR: Record<string, string> = {
  verde: '#3B6D11',
  amarelo: '#BA7517',
  vermelho: '#A32D2D',
  azul: '#185FA5',
  roxo: '#534AB7',
}

const formVazio = {
  numero_pedido: '', cliente_id: '', profissional_id: '', data_venda: '',
  prazo_prometido: '', observacoes_gerais: '', status: 'criado',
}

export default function Pedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [busca, setBusca] = useState('')
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([])
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState(formVazio)
  const [filtroStatus, setFiltroStatus] = useState<'abertos' | 'entregues' | 'todos'>('abertos')
  const [filtroProfissional, setFiltroProfissional] = useState<string>('')
  const [profissionais, setProfissionais] = useState<{ id: string; nome: string; tipo: string }[]>([])
  const [salvando, setSalvando] = useState(false)
  const [pagina, setPagina] = useState(1)
  const ITEMS_POR_PAGINA = 25
  const [pedidosComAT, setPedidosComAT] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const salvo = sessionStorage.getItem('operare_filtros_pedidos')
      if (salvo) {
        const f = JSON.parse(salvo)
        if (f.busca !== undefined) setBusca(f.busca)
        if (f.filtroStatus !== undefined) setFiltroStatus(f.filtroStatus)
        if (f.filtroProfissional !== undefined) setFiltroProfissional(f.filtroProfissional)
      }
    } catch {}
  }, [])

  useEffect(() => {
    try { sessionStorage.setItem('operare_filtros_pedidos', JSON.stringify({ busca, filtroStatus, filtroProfissional })) } catch {}
  }, [busca, filtroStatus, filtroProfissional])

  useEffect(() => { setPagina(1) }, [busca, filtroStatus, filtroProfissional])

  useEffect(() => {
    buscarPedidos()
    buscarClientes()
    buscarProfissionais()
    buscarATsAtivas()
  }, [])

  async function buscarPedidos() {
    setLoading(true)
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, clientes(nome, cidade, estado), profissionais(nome, tipo)')
      .range(0, 9999)
      .order('created_at', { ascending: false })
    if (error) console.error('Erro ao buscar pedidos:', error)
    setPedidos(data || [])
    setLoading(false)
  }

  async function buscarClientes() {
    const { data, error } = await supabase.from('clientes').select('id, nome').range(0, 9999).order('nome')
    if (error) console.error('Erro ao buscar clientes:', error)
    setClientes(data || [])
  }

  async function buscarATsAtivas() {
    const { data } = await supabase
      .from('assistencias_tecnicas')
      .select('pedido_id')
      .in('status', ['aberta', 'aguardando_retirada', 'em_reparo', 'enviado_fornecedor', 'aguardando_devolucao'])
      .range(0, 9999)
    setPedidosComAT(new Set((data || []).map((a: any) => a.pedido_id as string)))
  }

  async function buscarProfissionais() {
    const { data, error } = await supabase.from('profissionais').select('id, nome, tipo').eq('ativo', true).range(0, 9999).order('nome')
    if (error) console.error('Erro ao buscar profissionais:', error)
    setProfissionais(data || [])
  }

  function abrirNovo() {
    setEditandoId(null)
    setForm(formVazio)
    setShowForm(true)
  }

  function abrirEdicao(e: React.MouseEvent, p: Pedido) {
    e.preventDefault()
    e.stopPropagation()
    setEditandoId(p.id)
    setForm({
      numero_pedido: p.numero_pedido || '',
      cliente_id: p.cliente_id || '',
      profissional_id: p.profissional_id || '',
      data_venda: p.data_venda || '',
      prazo_prometido: p.prazo_prometido || '',
      observacoes_gerais: p.observacoes_gerais || '',
      status: p.status || 'criado',
    })
    setShowForm(true)
  }

  async function salvarPedido() {
    if (!form.numero_pedido) return alert('Número do pedido é obrigatório')
    if (!form.cliente_id) return alert('Selecione um cliente')
    if (!form.data_venda) return alert('Data da venda é obrigatória')
    setSalvando(true)
    try {
      const pedidoAtual = pedidos.find(p => p.id === editandoId)
      const payload: any = { ...form, profissional_id: form.profissional_id || null }
      if (editandoId && form.status === 'entregue' && !pedidoAtual?.data_entrega) {
        payload.data_entrega = new Date().toISOString().split('T')[0]
      }
      if (editandoId) {
        const { error } = await supabase.from('pedidos').update(payload).eq('id', editandoId)
        if (error) return alert('Erro ao atualizar: ' + error.message)
        await registrarHistorico({ tipo: 'pedido_editado', descricao: `Pedido ${form.numero_pedido} editado`, pedidoId: editandoId })
      } else {
        const { data: novo, error } = await supabase.from('pedidos').insert([{ ...payload, semaforo: 'verde' }]).select('id').single()
        if (error) return alert('Erro ao salvar: ' + error.message)
        await registrarHistorico({ tipo: 'pedido_criado', descricao: `Pedido ${form.numero_pedido} criado`, pedidoId: novo?.id })
      }
      setShowForm(false)
      setForm(formVazio)
      setEditandoId(null)
      buscarPedidos()
    } finally {
      setSalvando(false)
    }
  }

  const STATUS_ABERTOS = ['criado', 'aguardando_compra', 'em_producao', 'em_transporte', 'recebido', 'apto_agendamento', 'agendado', 'com_at']

  const filtrados = pedidos.filter(p => {
    const buscaOk = !busca || p.numero_pedido?.toLowerCase().includes(busca.toLowerCase()) || p.clientes?.nome?.toLowerCase().includes(busca.toLowerCase())
    if (!buscaOk) return false
    if (filtroStatus === 'abertos' && !STATUS_ABERTOS.includes(p.status)) return false
    if (filtroStatus === 'entregues' && p.status !== 'entregue' && p.status !== 'cancelado') return false
    if (filtroProfissional && p.profissional_id !== filtroProfissional) return false
    return true
  })
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITEMS_POR_PAGINA))
  const paginados = filtrados.slice((pagina - 1) * ITEMS_POR_PAGINA, pagina * ITEMS_POR_PAGINA)

  function exportarCSV() {
    const linhas = [
      ['Pedido', 'Cliente', 'Cidade', 'Status', 'Semáforo', 'Data criação'].join(';')
    ]
    pedidos.forEach(p => {
      linhas.push([
        p.numero_pedido || '',
        (p.clientes as any)?.nome || '',
        (p.clientes as any)?.cidade || '',
        p.status || '',
        p.semaforo || '',
        (p as any).created_at ? new Date((p as any).created_at).toLocaleDateString('pt-BR') : '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
    })
    const csv = '﻿' + linhas.join('\r\n') // BOM para Excel reconhecer UTF-8
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pedidos_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#f7f6f3' }}>
      <Sidebar ativa="/pedidos" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: '52px', background: '#fff', borderBottom: '0.5px solid #e8e7e3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', flexShrink: 0 }}>
          <span style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a2e' }}>Pedidos</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={exportarCSV}
              style={{ background: '#fff', color: '#555', border: '0.5px solid #e8e7e3', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
              ↓ Exportar CSV
            </button>
            <button onClick={abrirNovo} style={{ background: '#1a1a2e', color: '#C9A84C', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
              + Novo pedido
            </button>
          </div>
        </div>

        <div style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <input
              placeholder="Buscar por número ou cliente..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ width: '280px', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '4px', background: '#fff', border: '0.5px solid #e8e7e3', borderRadius: '8px', padding: '3px' }}>
              {([
                { key: 'abertos', label: 'Em aberto' },
                { key: 'entregues', label: 'Entregues' },
                { key: 'todos', label: 'Todos' },
              ] as const).map(op => (
                <button
                  key={op.key}
                  onClick={() => setFiltroStatus(op.key)}
                  style={{ padding: '5px 14px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: '500', cursor: 'pointer', background: filtroStatus === op.key ? '#1a1a2e' : 'transparent', color: filtroStatus === op.key ? '#C9A84C' : '#888', transition: 'all 0.15s' }}
                >
                  {op.label}
                </button>
              ))}
            </div>
            {profissionais.length > 0 && (
              <select
                value={filtroProfissional}
                onChange={e => setFiltroProfissional(e.target.value)}
                style={{ padding: '7px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '12px', background: filtroProfissional ? '#1a1a2e' : '#fff', color: filtroProfissional ? '#C9A84C' : '#888', outline: 'none', cursor: 'pointer' }}
              >
                <option value="">Todos os profissionais</option>
                {profissionais.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            )}
            <span style={{ fontSize: '12px', color: '#aaa' }}>{filtrados.length} pedido{filtrados.length !== 1 ? 's' : ''}</span>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 140px 100px 100px 80px 120px 72px', padding: '10px 16px', background: '#f7f6f3', fontSize: '11px', fontWeight: '500', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', gap: '8px' }}>
              <span>Pedido</span><span>Cliente</span><span>Profissional</span><span>Data venda</span><span>Prazo</span><span>Semáforo</span><span>Status</span><span></span>
            </div>

            {loading && <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Carregando...</div>}

            {!loading && filtrados.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Nenhum pedido cadastrado ainda.</div>
            )}

            {paginados.map((p, i) => (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 140px 100px 100px 80px 120px 72px', padding: '12px 16px', borderTop: '0.5px solid #f0efe9', alignItems: 'center', gap: '8px', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                <a href={`/pedidos/${p.id}`} style={{ fontSize: '12px', fontWeight: '500', color: '#C9A84C', textDecoration: 'none' }}>{p.numero_pedido}</a>
                <a href={`/pedidos/${p.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>{p.clientes?.nome}</div>
                  <div style={{ fontSize: '11px', color: '#888' }}>{p.clientes?.cidade} {p.clientes?.estado}</div>
                </a>
                <div>
                  {p.profissionais ? (
                    <>
                      <div style={{ fontSize: '12px', color: '#1a1a2e', fontWeight: '500' }}>{p.profissionais.nome}</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>{p.profissionais.tipo}</div>
                    </>
                  ) : <span style={{ fontSize: '12px', color: '#ccc' }}>—</span>}
                </div>
                <span style={{ fontSize: '12px', color: '#555' }}>{p.data_venda ? new Date(p.data_venda + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</span>
                <span style={{ fontSize: '12px', color: p.prazo_prometido && new Date(p.prazo_prometido + 'T12:00:00') < new Date() ? '#A32D2D' : '#555', fontWeight: p.prazo_prometido && new Date(p.prazo_prometido + 'T12:00:00') < new Date() ? '500' : '400' }}>
                  {p.prazo_prometido ? new Date(p.prazo_prometido + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: SEMAFORO_COLOR[p.semaforo] || '#888' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', fontWeight: '500', background: STATUS_COLOR[p.status]?.bg || '#f0efe9', color: STATUS_COLOR[p.status]?.color || '#555' }}>
                      {STATUS_LABEL[p.status] || p.status}
                    </span>
                    {pedidosComAT.has(p.id) && (
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '6px', fontWeight: '500', background: '#FCEBEB', color: '#791F1F' }}>
                        AT ativa
                      </span>
                    )}
                  </div>
                  {p.data_entrega && (
                    <span style={{ fontSize: '10px', color: '#888' }}>
                      Entregue {new Date(p.data_entrega + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
                <button
                  onClick={e => abrirEdicao(e, p)}
                  style={{ padding: '5px 12px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#555' }}
                >
                  Editar
                </button>
              </div>
            ))}

            {totalPaginas > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '12px 16px', borderTop: '0.5px solid #f0efe9' }}>
                <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
                  style={{ padding: '5px 12px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: pagina === 1 ? '#f7f6f3' : '#fff', fontSize: '12px', cursor: pagina === 1 ? 'default' : 'pointer', color: pagina === 1 ? '#ccc' : '#555' }}>
                  ← Anterior
                </button>
                <span style={{ fontSize: '12px', color: '#888' }}>Página {pagina} de {totalPaginas}</span>
                <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
                  style={{ padding: '5px 12px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: pagina === totalPaginas ? '#f7f6f3' : '#fff', fontSize: '12px', cursor: pagina === totalPaginas ? 'default' : 'pointer', color: pagina === totalPaginas ? '#ccc' : '#555' }}>
                  Próxima →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '480px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a2e' }}>{editandoId ? 'Editar pedido' : 'Novo pedido'}</span>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Número do pedido *</div>
              <input value={form.numero_pedido} onChange={e => setForm({ ...form, numero_pedido: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Cliente *</div>
              <select value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                <option value="">Selecione o cliente</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Profissional / Arquiteto(a)</div>
              <select value={form.profissional_id} onChange={e => setForm({ ...form, profissional_id: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                <option value="">Nenhum</option>
                {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome} — {p.tipo}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Data da venda *</div>
              <input type="date" value={form.data_venda} onChange={e => setForm({ ...form, data_venda: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Prazo prometido ao cliente</div>
              <input type="date" value={form.prazo_prometido} onChange={e => setForm({ ...form, prazo_prometido: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {editandoId && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Status</div>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Observações</div>
              <textarea value={form.observacoes_gerais} onChange={e => setForm({ ...form, observacoes_gerais: e.target.value })} rows={3}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
              <button onClick={salvarPedido} disabled={salvando} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#1a1a2e', color: '#C9A84C', fontSize: '13px', fontWeight: '500', cursor: 'pointer', opacity: salvando ? 0.7 : 1 }}>
                {salvando ? 'Salvando...' : (editandoId ? 'Salvar alterações' : 'Salvar pedido')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
