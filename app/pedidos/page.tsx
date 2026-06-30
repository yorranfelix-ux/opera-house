'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

interface Pedido {
  id: string
  numero_pedido: string
  cliente_id: string
  data_venda: string
  prazo_prometido: string
  status: string
  semaforo: string
  observacoes_gerais: string
  clientes: { nome: string; cidade: string; estado: string }
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
  numero_pedido: '', cliente_id: '', data_venda: '',
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

  useEffect(() => {
    buscarPedidos()
    buscarClientes()
  }, [])

  async function buscarPedidos() {
    setLoading(true)
    const { data } = await supabase
      .from('pedidos')
      .select('*, clientes(nome, cidade, estado)')
      .order('created_at', { ascending: false })
    setPedidos(data || [])
    setLoading(false)
  }

  async function buscarClientes() {
    const { data } = await supabase.from('clientes').select('id, nome').order('nome')
    setClientes(data || [])
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
    if (editandoId) {
      const { error } = await supabase.from('pedidos').update(form).eq('id', editandoId)
      if (error) return alert('Erro ao atualizar: ' + error.message)
    } else {
      const { error } = await supabase.from('pedidos').insert([{ ...form, semaforo: 'verde' }])
      if (error) return alert('Erro ao salvar: ' + error.message)
    }
    setShowForm(false)
    setForm(formVazio)
    setEditandoId(null)
    buscarPedidos()
  }

  const filtrados = pedidos.filter(p =>
    p.numero_pedido?.toLowerCase().includes(busca.toLowerCase()) ||
    p.clientes?.nome?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#f7f6f3' }}>
      <Sidebar ativa="/pedidos" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: '52px', background: '#fff', borderBottom: '0.5px solid #e8e7e3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', flexShrink: 0 }}>
          <span style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a2e' }}>Pedidos</span>
          <button onClick={abrirNovo} style={{ background: '#1a1a2e', color: '#C9A84C', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
            + Novo pedido
          </button>
        </div>

        <div style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
          <input
            placeholder="Buscar por número ou cliente..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ width: '300px', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', marginBottom: '16px', outline: 'none' }}
          />

          <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 100px 100px 80px 120px 72px', padding: '10px 16px', background: '#f7f6f3', fontSize: '11px', fontWeight: '500', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', gap: '8px' }}>
              <span>Pedido</span><span>Cliente</span><span>Data venda</span><span>Prazo</span><span>Semáforo</span><span>Status</span><span></span>
            </div>

            {loading && <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Carregando...</div>}

            {!loading && filtrados.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Nenhum pedido cadastrado ainda.</div>
            )}

            {filtrados.map((p, i) => (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 100px 100px 80px 120px 72px', padding: '12px 16px', borderTop: '0.5px solid #f0efe9', alignItems: 'center', gap: '8px', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                <a href={`/pedidos/${p.id}`} style={{ fontSize: '12px', fontWeight: '500', color: '#C9A84C', textDecoration: 'none' }}>{p.numero_pedido}</a>
                <a href={`/pedidos/${p.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>{p.clientes?.nome}</div>
                  <div style={{ fontSize: '11px', color: '#888' }}>{p.clientes?.cidade} {p.clientes?.estado}</div>
                </a>
                <span style={{ fontSize: '12px', color: '#555' }}>{p.data_venda ? new Date(p.data_venda + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</span>
                <span style={{ fontSize: '12px', color: p.prazo_prometido && new Date(p.prazo_prometido) < new Date() ? '#A32D2D' : '#555', fontWeight: p.prazo_prometido && new Date(p.prazo_prometido) < new Date() ? '500' : '400' }}>
                  {p.prazo_prometido ? new Date(p.prazo_prometido + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: SEMAFORO_COLOR[p.semaforo] || '#888' }} />
                </div>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', fontWeight: '500', background: STATUS_COLOR[p.status]?.bg || '#f0efe9', color: STATUS_COLOR[p.status]?.color || '#555' }}>
                  {STATUS_LABEL[p.status] || p.status}
                </span>
                <button
                  onClick={e => abrirEdicao(e, p)}
                  style={{ padding: '5px 12px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#555' }}
                >
                  Editar
                </button>
              </div>
            ))}
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
              <button onClick={salvarPedido} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#1a1a2e', color: '#C9A84C', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                {editandoId ? 'Salvar alterações' : 'Salvar pedido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
