'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { registrarHistorico } from '../lib/historico'
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

interface ItemPedido {
  id: string
  descricao: string
  quantidade: number
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
  const [itensPedido, setItensPedido] = useState<ItemPedido[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showFornecedorForm, setShowFornecedorForm] = useState(false)
  const [atSelecionada, setAtSelecionada] = useState<AT | null>(null)
  const [ocorrenciaOrigem, setOcorrenciaOrigem] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'ativas' | 'finalizadas' | 'todos'>('ativas')
  const [form, setForm] = useState({
    pedido_id: '',
    item_id: '',
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
  const [showProcessoModal, setShowProcessoModal] = useState(false)
  const [showRetornoModal, setShowRetornoModal] = useState(false)
  const [showResolvidaModal, setShowResolvidaModal] = useState(false)
  const [processoObs, setProcessoObs] = useState('')
  const [retornoObs, setRetornoObs] = useState('')
  const [resolvidaObs, setResolvidaObs] = useState('')

  useEffect(() => {
    buscarATs()
    buscarPedidos()
    buscarFornecedores()
    // Pre-fill form from URL params (when coming from "Abrir AT" on ocorrências)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const pedidoId = params.get('pedido_id')
      const itemId = params.get('item_id')
      const descricao = params.get('descricao')
      const ocorrenciaId = params.get('ocorrencia_id')
      if (pedidoId) {
        setForm(f => ({ ...f, pedido_id: pedidoId, item_id: itemId || '', descricao_problema: descricao || '' }))
        if (ocorrenciaId) setOcorrenciaOrigem(ocorrenciaId)
        setShowForm(true)
      }
    }
  }, [])

  useEffect(() => {
    if (form.pedido_id) buscarItensPedido(form.pedido_id)
    else setItensPedido([])
  }, [form.pedido_id])

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

  async function buscarItensPedido(pedidoId: string) {
    const { data } = await supabase.from('itens_pedido').select('id, descricao, quantidade').eq('pedido_id', pedidoId).order('created_at')
    setItensPedido((data as unknown as ItemPedido[]) || [])
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

    const pedidoSelecionado = pedidos.find(p => p.id === form.pedido_id)
    const ano = new Date().getFullYear()
    const { data: atsExistentes } = await supabase
      .from('assistencias_tecnicas')
      .select('id')
      .eq('pedido_id', form.pedido_id)
    const sequencia = (atsExistentes?.length || 0) + 1
    const numeroAt = `AT ${pedidoSelecionado?.numero_pedido}-${ano}-${sequencia}`

    const { error } = await supabase.from('assistencias_tecnicas').insert([{
      numero_at: numeroAt,
      pedido_id: form.pedido_id,
      item_id: (form as any).item_id || null,
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
    await registrarHistorico({ tipo: 'at_criada', descricao: `AT ${numeroAt} aberta — ${form.descricao_problema}`, pedidoId: form.pedido_id })

    // Se veio de uma ocorrência, fecha ela automaticamente
    if (ocorrenciaOrigem) {
      await supabase.from('ocorrencias').update({
        status: 'resolvida',
        observacoes: `Convertida em AT ${numeroAt}`,
      }).eq('id', ocorrenciaOrigem)
      setOcorrenciaOrigem(null)
      // Limpa os params da URL sem recarregar
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/assistencia')
      }
    }

    setShowForm(false)
    setForm({ pedido_id: '', item_id: '', tipo_at: 'retirada_cliente', descricao_problema: '', requer_retirada: false, endereco_retirada: '', data_retirada_agendada: '', fornecedor_id: '', data_envio_fornecedor: '', previsao_retorno_fornecedor: '', observacoes: '' } as any)
    setItensPedido([])
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
    const forn = fornecedores.find(f => f.id === fornecedorForm.fornecedor_id)
    const nomeForn = forn?.nome_fantasia || forn?.razao_social || 'fornecedor'
    await registrarHistorico({ tipo: 'at_atualizada', descricao: `${atSelecionada.numero_at} → Enviado ao fornecedor ${nomeForn}` })
    setShowFornecedorForm(false)
    setAtSelecionada(null)
    setFornecedorForm({ fornecedor_id: '', data_envio_fornecedor: '', previsao_retorno_fornecedor: '', observacoes_fornecedor: '', numero_nf_envio: '' })
    buscarATs()
  }

  async function iniciarProcesso() {
    if (!atSelecionada) return
    const { error } = await supabase.from('assistencias_tecnicas').update({ status: 'em_reparo', observacoes: processoObs }).eq('id', atSelecionada.id)
    if (error) return alert('Erro: ' + error.message)
    await registrarHistorico({ tipo: 'at_atualizada', descricao: `${atSelecionada.numero_at} → Em reparo${processoObs ? ': ' + processoObs : ''}`, pedidoId: atSelecionada.pedidos?.numero_pedido ? undefined : undefined })
    setShowProcessoModal(false); setAtSelecionada(null); setProcessoObs(''); buscarATs()
  }

  async function registrarRetorno() {
    if (!atSelecionada) return
    const { error } = await supabase.from('assistencias_tecnicas').update({ status: 'aguardando_devolucao', observacoes_fornecedor: retornoObs }).eq('id', atSelecionada.id)
    if (error) return alert('Erro: ' + error.message)
    await registrarHistorico({ tipo: 'at_atualizada', descricao: `${atSelecionada.numero_at} → Retornou do fornecedor${retornoObs ? ': ' + retornoObs : ''}` })
    setShowRetornoModal(false); setAtSelecionada(null); setRetornoObs(''); buscarATs()
  }

  async function marcarResolvida() {
    if (!atSelecionada) return
    const { error } = await supabase.from('assistencias_tecnicas').update({ status: 'resolvida', observacoes: resolvidaObs }).eq('id', atSelecionada.id)
    if (error) return alert('Erro: ' + error.message)
    await registrarHistorico({ tipo: 'at_atualizada', descricao: `${atSelecionada.numero_at} → Resolvida${resolvidaObs ? ': ' + resolvidaObs : ''}` })
    setShowResolvidaModal(false); setAtSelecionada(null); setResolvidaObs(''); buscarATs()
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
                <div>
                  {(a as any).itens_pedido?.descricao && (
                    <div style={{ fontSize: '11px', fontWeight: '500', color: '#C9A84C', marginBottom: '2px' }}>{(a as any).itens_pedido.descricao}</div>
                  )}
                  <div style={{ fontSize: '13px', color: '#333' }}>{a.descricao_problema}</div>
                </div>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', fontWeight: '500', background: STATUS_COR[a.status]?.bg || '#f0efe9', color: STATUS_COR[a.status]?.color || '#555' }}>
                  {STATUS_COR[a.status]?.label || a.status}
                </span>
                <div>
                  <div style={{ fontSize: '11px', color: '#555' }}>{a.fornecedores?.nome_fantasia || a.fornecedores?.razao_social || '-'}</div>
                  {(a as any).numero_nf_envio && (
                    <div style={{ fontSize: '10px', color: '#C9A84C', marginTop: '2px' }}>NF envio: {(a as any).numero_nf_envio}</div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <a href={`/assistencia/${a.id}`}
                    style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', border: '0.5px solid #e8e7e3', color: '#555', background: '#fff', cursor: 'pointer', textDecoration: 'none', display: 'block', textAlign: 'center' }}>
                    Ver detalhes
                  </a>
                  {(a.status === 'aberta' || a.status === 'aguardando_retirada') && (
                    <button onClick={() => { setAtSelecionada(a); setProcessoObs(''); setShowProcessoModal(true) }}
                      style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', border: '0.5px solid #0C447C', color: '#0C447C', background: '#E6F1FB', cursor: 'pointer' }}>
                      Em processo
                    </button>
                  )}
                  {(a.status === 'aberta' || a.status === 'em_reparo') && (
                    <button onClick={() => { setAtSelecionada(a); setShowFornecedorForm(true) }}
                      style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', border: '0.5px solid #3C3489', color: '#3C3489', background: '#EEEDFE', cursor: 'pointer' }}>
                      Enviar fornecedor
                    </button>
                  )}
                  {a.status === 'enviado_fornecedor' && (
                    <button onClick={() => { setAtSelecionada(a); setRetornoObs(''); setShowRetornoModal(true) }}
                      style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', border: '0.5px solid #633806', color: '#633806', background: '#FAEEDA', cursor: 'pointer' }}>
                      Registrar retorno
                    </button>
                  )}
                  {(a.status === 'em_reparo' || a.status === 'aguardando_devolucao') && (
                    <button onClick={() => { setAtSelecionada(a); setResolvidaObs(''); setShowResolvidaModal(true) }}
                      style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', border: '0.5px solid #27500A', color: '#27500A', background: '#EAF3DE', cursor: 'pointer' }}>
                      Marcar resolvida
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
              <span style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a2e' }}>Nova Assistência Técnica</span>
              <button onClick={() => { setShowForm(false); setOcorrenciaOrigem(null) }} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            {ocorrenciaOrigem && (
              <div style={{ background: '#EEEDFE', border: '0.5px solid #3C3489', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: '#3C3489' }}>
                Originada de uma ocorrência — ao salvar, a ocorrência será fechada automaticamente.
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Pedido *</div>
              <select value={form.pedido_id} onChange={e => setForm({ ...form, pedido_id: e.target.value, item_id: '' } as any)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                <option value="">Selecione o pedido</option>
                {pedidos.map(p => <option key={p.id} value={p.id}>{p.numero_pedido} - {p.clientes?.nome}</option>)}
              </select>
            </div>

            {itensPedido.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Item com problema</div>
                <select value={(form as any).item_id} onChange={e => setForm({ ...form, item_id: e.target.value } as any)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="">Selecione o item (opcional)</option>
                  {itensPedido.map(it => <option key={it.id} value={it.id}>{it.descricao} (Qtd: {it.quantidade})</option>)}
                </select>
              </div>
            )}

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

      {showProcessoModal && atSelecionada && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a2e' }}>Em processo de reparo</span>
              <button onClick={() => setShowProcessoModal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>AT {atSelecionada.numero_at} — {atSelecionada.descricao_problema}</div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Observações do processo</div>
              <textarea value={processoObs} onChange={e => setProcessoObs(e.target.value)} rows={3} placeholder="Descreva o que está sendo feito no reparo..." style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowProcessoModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
              <button onClick={iniciarProcesso} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#1a1a2e', color: '#C9A84C', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {showRetornoModal && atSelecionada && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a2e' }}>Registrar retorno do fornecedor</span>
              <button onClick={() => setShowRetornoModal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>AT {atSelecionada.numero_at} — {atSelecionada.descricao_problema}</div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Observações do retorno</div>
              <textarea value={retornoObs} onChange={e => setRetornoObs(e.target.value)} rows={3} placeholder="Como o item voltou do fornecedor..." style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRetornoModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
              <button onClick={registrarRetorno} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#1a1a2e', color: '#C9A84C', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Confirmar retorno</button>
            </div>
          </div>
        </div>
      )}

      {showResolvidaModal && atSelecionada && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a2e' }}>Marcar como resolvida</span>
              <button onClick={() => setShowResolvidaModal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>AT {atSelecionada.numero_at} — {atSelecionada.descricao_problema}</div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Observações da resolução</div>
              <textarea value={resolvidaObs} onChange={e => setResolvidaObs(e.target.value)} rows={3} placeholder="Como o problema foi resolvido..." style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowResolvidaModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
              <button onClick={marcarResolvida} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#3B6D11', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Marcar resolvida</button>
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
