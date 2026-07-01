'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

interface AT {
  id: string
  created_at: string
  numero_at: string
  descricao_problema: string
  status: string
  tipo_at: string
  requer_retirada: boolean
  data_retirada_agendada: string
  endereco_retirada: string
  data_envio_fornecedor: string
  previsao_retorno_fornecedor: string
  data_retorno_fornecedor: string
  observacoes_fornecedor: string
  pedidos: { numero_pedido: string; clientes: { nome: string; cidade: string } }
  fornecedores: { nome_fantasia: string; razao_social: string }
}

interface Pedido {
  id: string
  numero_pedido: string
  clientes: { nome: string }
}

interface Fornecedor {
  id: string
  nome_fantasia: string
  razao_social: string
}

const STATUS_COR: Record<string, { bg: string; color: string; label: string }> = {
  aberta: { bg: '#FAECE7', color: '#712B13', label: 'Aberta' },
  aguardando_retirada: { bg: '#FAEEDA', color: '#633806', label: 'Aguard. retirada' },
  em_reparo: { bg: '#E6F1FB', color: '#0C447C', label: 'Em reparo' },
  enviado_fornecedor: { bg: '#EEEDFE', color: '#3C3489', label: 'No fornecedor' },
  aguardando_devolucao: { bg: '#FAEEDA', color: '#633806', label: 'Aguard. devolucao' },
  resolvida: { bg: '#EAF3DE', color: '#27500A', label: 'Resolvida' },
  cancelada: { bg: '#f0efe9', color: '#888', label: 'Cancelada' },
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Pedidos', href: '/pedidos' },
  { label: 'Clientes', href: '/clientes' },
  { label: 'Fornecedores', href: '/fornecedores' },
  { label: 'Assistencia Tecnica', href: '/assistencia' },
  { label: 'Ocorrencias', href: '/ocorrencias' },
  { label: 'Entregas', href: '/entregas' },
]

export default function AssistenciaTecnica() {
  const [ats, setAts] = useState<AT[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showFornecedorForm, setShowFornecedorForm] = useState(false)
  const [atSelecionada, setAtSelecionada] = useState<AT | null>(null)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'ativas' | 'finalizadas' | 'todos'>('ativas')
  const [form, setForm] = useState({
    pedido_id: '',
    tipo_at: 'retirada_cliente',
    descricao_problema: '',
    requer_retirada: false,
    endereco_retirada: '',
    data_retirada_agendada: '',
    fornecedor_id: '',
    data_envio_fornecedor: '',
    previsao_retorno_fornecedor: '',
    observacoes: '',
  })
  const [fornecedorForm, setFornecedorForm] = useState({
    fornecedor_id: '',
    data_envio_fornecedor: '',
    previsao_retorno_fornecedor: '',
    observacoes_fornecedor: '',
    numero_nf_envio: '',
  })

  useEffect(() => {
    buscarATs()
    buscarPedidos()
    buscarFornecedores()
  }, [])

  async function buscarATs() {
    const { data } = await supabase
      .from('assistencias_tecnicas')
      .select('*, pedidos(numero_pedido, clientes(nome, cidade)), fornecedores(nome_fantasia, razao_social)')
      .order('created_at', { ascending: false })
    setAts((data as unknown as AT[]) || [])
  }

  async function buscarPedidos() {
    const { data } = await supabase
      .from('pedidos')
      .select('id, numero_pedido, clientes(nome)')
      .order('numero_pedido', { ascending: false })
    setPedidos((data as unknown as Pedido[]) || [])
  }

  async function buscarFornecedores() {
    const { data } = await supabase
      .from('fornecedores')
      .select('id, nome_fantasia, razao_social')
      .order('nome_fantasia')
    setFornecedores((data as unknown as Fornecedor[]) || [])
  }

  async function salvar() {
    if (!form.pedido_id) return alert('Selecione o pedido')
    if (!form.descricao_problema) return alert('Descricao do problema e obrigatoria')

    let status = 'aberta'
    if (form.tipo_at === 'devolucao_fornecedor') status = 'enviado_fornecedor'
    else if (form.requer_retirada) status = 'aguardando_retirada'

    const { error } = await supabase.from('assistencias_tecnicas').insert([{
      pedido_id: form.pedido_id,
      tipo_at: form.tipo_at,
      descricao_problema: form.descricao_problema,
      requer_retirada: form.requer_retirada,
      endereco_retirada: form.endereco_retirada,
      data_retirada_agendada: form.data_retirada_agendada || null,
      fornecedor_id: form.fornecedor_id || null,
      data_envio_fornecedor: form.data_envio_fornecedor || null,
      previsao_retorno_fornecedor: form.previsao_retorno_fornecedor || null,
      observacoes: form.observacoes,
      status,
    }])
    if (error) return alert('Erro: ' + error.message)
    setShowForm(false)
    setForm({ pedido_id: '', tipo_at: 'retirada_cliente', descricao_problema: '', requer_retirada: false, endereco_retirada: '', data_retirada_agendada: '', fornecedor_id: '', data_envio_fornecedor: '', previsao_retorno_fornecedor: '', observacoes: '' })
    buscarATs()
  }

  async function enviarAoFornecedor() {
    if (!atSelecionada) return
    if (!fornecedorForm.fornecedor_id) return alert('Selecione o fornecedor')
    if (!fornecedorForm.data_envio_fornecedor) return alert('Informe a data de envio')
    const { error } = await supabase
      .from('assistencias_tecnicas')
      .update({
        fornecedor_id: fornecedorForm.fornecedor_id,
        data_envio_fornecedor: fornecedorForm.data_envio_fornecedor,
        previsao_retorno_fornecedor: fornecedorForm.previsao_retorno_fornecedor || null,
        observacoes_fornecedor: fornecedorForm.observacoes_fornecedor,
        numero_nf_envio: fornecedorForm.numero_nf_envio || null,
        status: 'enviado_fornecedor',
      })
      .eq('id', atSelecionada.id)
    if (error) return alert('Erro: ' + error.message)
    setShowFornecedorForm(false)
    setAtSelecionada(null)
    setFornecedorForm({ fornecedor_id: '', data_envio_fornecedor: '', previsao_retorno_fornecedor: '', observacoes_fornecedor: '', numero_nf_envio: '' })
    buscarATs()
  }

  const STATUS_ATIVAS = ['aberta', 'aguardando_retirada', 'em_reparo', 'enviado_fornecedor', 'aguardando_devolucao']

  const filtradas = ats.filter(a => {
    const buscaOk = a.pedidos?.numero_pedido?.includes(busca) || a.pedidos?.clientes?.nome?.toLowerCase().includes(busca.toLowerCase()) || a.descricao_problema?.toLowerCase().includes(busca.toLowerCase()) || (a.numero_at || '').includes(busca)
    if (!buscaOk) return false
    if (filtroStatus === 'ativas') return STATUS_ATIVAS.includes(a.status)
    if (filtroStatus === 'finalizadas') return a.status === 'resolvida' || a.status === 'cancelada'
    return true
  })

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#f7f6f3' }}>
      <Sidebar ativa="/assistencia" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: '52px', background: '#fff', borderBottom: '0.5px solid #e8e7e3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', flexShrink: 0 }}>
          <span style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a2e' }}>Assistencia Tecnica</span>
          <button onClick={() => setShowForm(true)} style={{ background: '#1a1a2e', color: '#C9A84C', border: 'none', padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
            + Nova AT
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <input
              placeholder="Buscar por pedido, cliente ou descrição..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ width: '280px', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '4px', background: '#fff', border: '0.5px solid #e8e7e3', borderRadius: '8px', padding: '3px' }}>
              {([
                { key: 'ativas', label: 'Em aberto' },
                { key: 'finalizadas', label: 'Finalizadas' },
                { key: 'todos', label: 'Todas' },
              ] as const).map(op => (
                <button
                  key={op.key}
                  onClick={() => setFiltroStatus(op.key)}
                  style={{ padding: '5px 14px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: '500', cursor: 'pointer', background: filtroStatus === op.key ? '#1a1a2e' : 'transparent', color: filtroStatus === op.key ? '#C9A84C' : '#888' }}
                >
                  {op.label}
                </button>
              ))}
            </div>
            <span style={{ fontSize: '12px', color: '#aaa' }}>{filtradas.length} AT{filtradas.length !== 1 ? 's' : ''}</span>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '90px 110px 1fr 150px 120px 110px', padding: '8px 16px', background: '#f7f6f3', fontSize: '10px', fontWeight: '500', color: '#888', textTransform: 'uppercase', letterSpacing: '0.4px', gap: '8px' }}>
              <span>Pedido</span>
              <span>Tipo</span>
              <span>Problema</span>
              <span>Status</span>
              <span>Fornecedor</span>
              <span>Acoes</span>
            </div>

            {filtradas.length === 0 && (
              <div style={{ padding: '32px', textAlign: 'center', color: '#888', fontSize: '13px' }}>
                Nenhuma AT encontrada.
              </div>
            )}

            {filtradas.map((a, i) => (
              <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '90px 110px 1fr 150px 120px 110px', padding: '12px 16px', borderTop: '0.5px solid #f0efe9', alignItems: 'center', gap: '8px', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>{a.pedidos?.numero_pedido}</div>
                  <div style={{ fontSize: '11px', color: '#888' }}>{a.pedidos?.clientes?.nome}</div>
                </div>
                <span style={{ fontSize: '11px', color: '#555' }}>
                  {a.tipo_at === 'devolucao_fornecedor' ? 'Devol. fornecedor' : 'Retirada cliente'}
                </span>
                <span style={{ fontSize: '13px', color: '#333' }}>{a.descricao_problema}</span>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', fontWeight: '500', background: STATUS_COR[a.status]?.bg || '#f0efe9', color: STATUS_COR[a.status]?.color || '#555' }}>
                  {STATUS_COR[a.status]?.label || a.status}
                </span>
                <div>
                  <div style={{ fontSize: '11px', color: '#555' }}>{a.fornecedores?.nome_fantasia || a.fornecedores?.razao_social || '-'}</div>
                  {(a as any).numero_nf_envio && (
                    <div style={{ fontSize: '10px', color: '#C9A84C', marginTop: '2px' }}>NF envio: {(a as any).numero_nf_envio}</div>
                  )}
                </div>
                <div>
                  {(a.status === 'aberta' || a.status === 'em_reparo') && (
                    <button
                      onClick={() => { setAtSelecionada(a); setShowFornecedorForm(true) }}
                      style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', border: '0.5px solid #3C3489', color: '#3C3489', background: '#EEEDFE', cursor: 'pointer' }}
                    >
                      Enviar fornecedor
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '500px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a2e' }}>Nova Assistencia Tecnica</span>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>x</button>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Pedido *</div>
              <select value={form.pedido_id} onChange={e => setForm({ ...form, pedido_id: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                <option value="">Selecione o pedido</option>
                {pedidos.map(p => <option key={p.id} value={p.id}>{p.numero_pedido} - {p.clientes?.nome}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Tipo da AT *</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { value: 'retirada_cliente', label: 'Retirada no cliente' },
                  { value: 'devolucao_fornecedor', label: 'Devolucao ao fornecedor' },
                ].map(op => (
                  <button
                    key={op.value}
                    onClick={() => setForm({ ...form, tipo_at: op.value })}
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: form.tipo_at === op.value ? '2px solid #1a1a2e' : '0.5px solid #e8e7e3', background: form.tipo_at === op.value ? '#1a1a2e' : '#fff', color: form.tipo_at === op.value ? '#C9A84C' : '#555', fontSize: '12px', cursor: 'pointer', fontWeight: form.tipo_at === op.value ? '500' : 'normal' }}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Descricao do problema *</div>
              <textarea value={form.descricao_problema} onChange={e => setForm({ ...form, descricao_problema: e.target.value })} rows={3} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
            </div>

            {form.tipo_at === 'retirada_cliente' && (
              <div>
                <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" id="retirada" checked={form.requer_retirada} onChange={e => setForm({ ...form, requer_retirada: e.target.checked })} />
                  <label htmlFor="retirada" style={{ fontSize: '13px', color: '#555', cursor: 'pointer' }}>Requer retirada agendada</label>
                </div>
                {form.requer_retirada && (
                  <div>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Endereco de retirada</div>
                      <input value={form.endereco_retirada} onChange={e => setForm({ ...form, endereco_retirada: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Data retirada agendada</div>
                      <input type="date" value={form.data_retirada_agendada} onChange={e => setForm({ ...form, data_retirada_agendada: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {form.tipo_at === 'devolucao_fornecedor' && (
              <div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Fornecedor</div>
                  <select value={form.fornecedor_id} onChange={e => setForm({ ...form, fornecedor_id: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                    <option value="">Selecione o fornecedor</option>
                    {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome_fantasia || f.razao_social}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Data de envio ao fornecedor</div>
                  <input type="date" value={form.data_envio_fornecedor} onChange={e => setForm({ ...form, data_envio_fornecedor: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Previsao de retorno</div>
                  <input type="date" value={form.previsao_retorno_fornecedor} onChange={e => setForm({ ...form, previsao_retorno_fornecedor: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Observacoes</div>
              <textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={2} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
              <button onClick={salvar} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#1a1a2e', color: '#C9A84C', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {showFornecedorForm && atSelecionada && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '460px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a2e' }}>Enviar ao fornecedor</span>
              <button onClick={() => setShowFornecedorForm(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>x</button>
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '20px' }}>
              AT do pedido {atSelecionada.pedidos?.numero_pedido} — {atSelecionada.descricao_problema}
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Fornecedor *</div>
              <select value={fornecedorForm.fornecedor_id} onChange={e => setFornecedorForm({ ...fornecedorForm, fornecedor_id: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                <option value="">Selecione o fornecedor</option>
                {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome_fantasia || f.razao_social}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Data de envio *</div>
              <input type="date" value={fornecedorForm.data_envio_fornecedor} onChange={e => setFornecedorForm({ ...fornecedorForm, data_envio_fornecedor: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Previsao de retorno</div>
              <input type="date" value={fornecedorForm.previsao_retorno_fornecedor} onChange={e => setFornecedorForm({ ...fornecedorForm, previsao_retorno_fornecedor: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>NF de envio</div>
              <input value={fornecedorForm.numero_nf_envio} onChange={e => setFornecedorForm({ ...fornecedorForm, numero_nf_envio: e.target.value })} placeholder="Número da NF emitida para envio"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Observacoes</div>
              <textarea value={fornecedorForm.observacoes_fornecedor} onChange={e => setFornecedorForm({ ...fornecedorForm, observacoes_fornecedor: e.target.value })} rows={2} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowFornecedorForm(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
              <button onClick={enviarAoFornecedor} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#1a1a2e', color: '#C9A84C', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Confirmar envio</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
