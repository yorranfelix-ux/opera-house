'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

interface Ocorrencia {
  id: string
  created_at: string
  tipo: string
  descricao: string
  observacoes: string
  status: string
  pedido_id: string
  pedidos: { numero_pedido: string; clientes: { nome: string } }
}

interface Pedido {
  id: string
  numero_pedido: string
  clientes: { nome: string }
}

const TIPOS: Record<string, string> = {
  avaria: 'Avaria',
  medida_errada: 'Medida errada',
  cor_errada: 'Cor errada',
  faltando_peca: 'Faltando peça',
  defeito_fabricacao: 'Defeito de fabricação',
  outro: 'Outro',
}

const STATUS_LISTA = ['aberta', 'em_tratativa', 'resolvida', 'cancelada']

const STATUS_COR: Record<string, { bg: string; color: string }> = {
  aberta: { bg: '#FAECE7', color: '#712B13' },
  em_tratativa: { bg: '#FAEEDA', color: '#633806' },
  resolvida: { bg: '#EAF3DE', color: '#27500A' },
  cancelada: { bg: '#f0efe9', color: '#888' },
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Pedidos', href: '/pedidos' },
  { label: 'Clientes', href: '/clientes' },
  { label: 'Fornecedores', href: '/fornecedores' },
  { label: 'Assistência Técnica', href: '/assistencia' },
  { label: 'Ocorrências', href: '/ocorrencias' },
  { label: 'Entregas', href: '/entregas' },
]

const formVazio = { pedido_id: '', tipo: 'avaria', descricao: '', observacoes: '', status: 'aberta' }

export default function Ocorrencias() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [showForm, setShowForm] = useState(false)
  const [busca, setBusca] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState(formVazio)

  useEffect(() => {
    buscarOcorrencias()
    buscarPedidos()
  }, [])

  async function buscarOcorrencias() {
    const { data } = await supabase
      .from('ocorrencias')
      .select('*, pedidos(numero_pedido, clientes(nome))')
      .order('created_at', { ascending: false })
    setOcorrencias((data as unknown as Ocorrencia[]) || [])
  }

  async function buscarPedidos() {
    const { data } = await supabase
      .from('pedidos')
      .select('id, numero_pedido, clientes(nome)')
      .order('numero_pedido', { ascending: false })
    setPedidos((data as unknown as Pedido[]) || [])
  }

  function abrirNovo() {
    setEditandoId(null)
    setForm(formVazio)
    setShowForm(true)
  }

  function abrirEdicao(o: Ocorrencia) {
    setEditandoId(o.id)
    setForm({
      pedido_id: o.pedido_id || '',
      tipo: o.tipo || 'avaria',
      descricao: o.descricao || '',
      observacoes: o.observacoes || '',
      status: o.status || 'aberta',
    })
    setShowForm(true)
  }

  async function salvar() {
    if (!form.pedido_id) return alert('Selecione o pedido')
    if (!form.descricao) return alert('Descrição é obrigatória')
    if (editandoId) {
      const { error } = await supabase.from('ocorrencias').update(form).eq('id', editandoId)
      if (error) return alert('Erro: ' + error.message)
    } else {
      const { error } = await supabase.from('ocorrencias').insert([{ ...form, status: 'aberta' }])
      if (error) return alert('Erro: ' + error.message)
    }
    setShowForm(false)
    setForm(formVazio)
    setEditandoId(null)
    buscarOcorrencias()
  }

  const filtradas = ocorrencias.filter(o =>
    o.pedidos?.numero_pedido?.includes(busca) ||
    o.pedidos?.clientes?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    o.descricao?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#f7f6f3' }}>
      <Sidebar ativa="/ocorrencias" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: '52px', background: '#fff', borderBottom: '0.5px solid #e8e7e3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', flexShrink: 0 }}>
          <span style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a2e' }}>Ocorrências</span>
          <button onClick={abrirNovo} style={{ background: '#1a1a2e', color: '#C9A84C', border: 'none', padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
            + Nova ocorrência
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <input
              placeholder="Buscar por pedido, cliente ou descrição..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ width: '320px', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none' }}
            />
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 130px 110px 100px 72px', padding: '8px 16px', background: '#f7f6f3', fontSize: '10px', fontWeight: '500', color: '#888', textTransform: 'uppercase', letterSpacing: '0.4px', gap: '8px' }}>
              <span>Pedido</span><span>Descrição</span><span>Tipo</span><span>Status</span><span>Data</span><span></span>
            </div>

            {filtradas.length === 0 && (
              <div style={{ padding: '32px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Nenhuma ocorrência encontrada.</div>
            )}

            {filtradas.map((o, i) => (
              <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 130px 110px 100px 72px', padding: '12px 16px', borderTop: '0.5px solid #f0efe9', alignItems: 'center', gap: '8px', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>{o.pedidos?.numero_pedido}</div>
                  <div style={{ fontSize: '11px', color: '#888' }}>{o.pedidos?.clientes?.nome}</div>
                </div>
                <span style={{ fontSize: '13px', color: '#333' }}>{o.descricao}</span>
                <span style={{ fontSize: '12px', color: '#555' }}>{TIPOS[o.tipo] || o.tipo}</span>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', fontWeight: '500', background: STATUS_COR[o.status]?.bg || '#f0efe9', color: STATUS_COR[o.status]?.color || '#555' }}>
                  {o.status.replace('_', ' ')}
                </span>
                <span style={{ fontSize: '11px', color: '#888' }}>
                  {new Date(o.created_at).toLocaleDateString('pt-BR')}
                </span>
                <button
                  onClick={() => abrirEdicao(o)}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '480px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a2e' }}>{editandoId ? 'Editar ocorrência' : 'Nova ocorrência'}</span>
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
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Tipo</div>
              <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            {editandoId && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Status</div>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                  {STATUS_LISTA.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Descrição *</div>
              <textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} rows={3}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
            </div>

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
