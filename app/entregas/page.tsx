'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface Entrega {
  id: string
  created_at: string
  pedido_id: string
  data_agendada: string
  data_realizada: string
  status: string
  requer_icamento: boolean
  observacoes_icamento: string
  observacoes: string
  pedidos: { numero_pedido: string; clientes: { nome: string; cidade: string; estado: string } }
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

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Pedidos', href: '/pedidos' },
  { label: 'Clientes', href: '/clientes' },
  { label: 'Fornecedores', href: '/fornecedores' },
  { label: 'Assistência Técnica', href: '/assistencia' },
  { label: 'Ocorrências', href: '/ocorrencias' },
  { label: 'Entregas', href: '/entregas' },
]

const formVazio = {
  pedido_id: '', data_agendada: '', data_realizada: '',
  status: 'agendada', requer_icamento: false,
  observacoes_icamento: '', observacoes: '',
}

export default function Entregas() {
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [showForm, setShowForm] = useState(false)
  const [busca, setBusca] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState(formVazio)

  useEffect(() => {
    buscarEntregas()
    buscarPedidos()
  }, [])

  async function buscarEntregas() {
    const { data } = await supabase
      .from('entregas')
      .select('*, pedidos(numero_pedido, clientes(nome, cidade, estado))')
      .order('data_agendada', { ascending: true })
    setEntregas((data as unknown as Entrega[]) || [])
  }

  async function buscarPedidos() {
    const { data } = await supabase
      .from('pedidos')
      .select('id, numero_pedido, clientes(nome, cidade)')
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

  const filtradas = entregas.filter(e =>
    e.pedidos?.numero_pedido?.includes(busca) ||
    e.pedidos?.clientes?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    e.pedidos?.clientes?.cidade?.toLowerCase().includes(busca.toLowerCase())
  )

  const hoje = new Date().toISOString().split('T')[0]

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#f7f6f3' }}>
      <div style={{ width: '200px', background: '#1a1a2e', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '22px 20px 16px', fontSize: '18px', fontWeight: '500', color: '#fff' }}>
          Opera <span style={{ color: '#C9A84C' }}>House</span>
        </div>
        <div style={{ height: '0.5px', background: '#2d2d44', margin: '0 16px 12px' }} />
        {navItems.map(item => (
          <a key={item.href} href={item.href} style={{ display: 'block', padding: '9px 20px', fontSize: '13px', color: item.href === '/entregas' ? '#C9A84C' : '#8888aa', textDecoration: 'none', margin: '0 8px', borderRadius: '8px', background: item.href === '/entregas' ? '#C9A84C18' : 'transparent' }}>
            {item.label}
          </a>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: '52px', background: '#fff', borderBottom: '0.5px solid #e8e7e3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', flexShrink: 0 }}>
          <span style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a2e' }}>Entregas</span>
          <button onClick={abrirNovo} style={{ background: '#1a1a2e', color: '#C9A84C', border: 'none', padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
            + Agendar entrega
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <input
              placeholder="Buscar por pedido, cliente ou cidade..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ width: '320px', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none' }}
            />
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 120px 130px 80px 100px 72px', padding: '8px 16px', background: '#f7f6f3', fontSize: '10px', fontWeight: '500', color: '#888', textTransform: 'uppercase', letterSpacing: '0.4px', gap: '8px' }}>
              <span>Pedido</span><span>Cliente</span><span>Data agendada</span><span>Status</span><span>Içamento</span><span>Realizada</span><span></span>
            </div>

            {filtradas.length === 0 && (
              <div style={{ padding: '32px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Nenhuma entrega encontrada.</div>
            )}

            {filtradas.map((e, i) => {
              const atrasada = e.status === 'agendada' && e.data_agendada < hoje
              return (
                <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 120px 130px 80px 100px 72px', padding: '12px 16px', borderTop: '0.5px solid #f0efe9', alignItems: 'center', gap: '8px', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>{e.pedidos?.numero_pedido}</div>
                  <div>
                    <div style={{ fontSize: '13px', color: '#333' }}>{e.pedidos?.clientes?.nome}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{e.pedidos?.clientes?.cidade} {e.pedidos?.clientes?.estado}</div>
                  </div>
                  <span style={{ fontSize: '12px', color: atrasada ? '#A32D2D' : '#555', fontWeight: atrasada ? '500' : 'normal' }}>
                    {e.data_agendada ? new Date(e.data_agendada + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                    {atrasada && <span style={{ marginLeft: '4px', fontSize: '10px' }}>(atrasada)</span>}
                  </span>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', fontWeight: '500', background: STATUS_COR[e.status]?.bg || '#f0efe9', color: STATUS_COR[e.status]?.color || '#555' }}>
                    {STATUS_COR[e.status]?.label || e.status}
                  </span>
                  <span style={{ fontSize: '12px', textAlign: 'center', color: '#555' }}>{e.requer_icamento ? 'Sim' : '-'}</span>
                  <span style={{ fontSize: '11px', color: '#555' }}>
                    {e.data_realizada ? new Date(e.data_realizada + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                  </span>
                  <button
                    onClick={() => abrirEdicao(e)}
                    style={{ padding: '5px 12px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#555' }}
                  >
                    Editar
                  </button>
                </div>
              )
            })}
          </div>
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
                {pedidos.map(p => <option key={p.id} value={p.id}>{p.numero_pedido} - {p.clientes?.nome}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Data agendada *</div>
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
                  placeholder="Ex: andar, equipamento necessário..."
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
                {editandoId ? 'Salvar alterações' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
