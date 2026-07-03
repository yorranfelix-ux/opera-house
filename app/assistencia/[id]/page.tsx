'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { registrarHistorico as registrarHistoricoGlobal } from '../../lib/historico'
import Sidebar from '../../components/Sidebar'
import { use } from 'react'

interface AT {
  id: string
  numero_at: string
  status: string
  tipo_at: string
  descricao_problema: string
  requer_retirada: boolean
  data_retirada_agendada: string
  endereco_retirada: string
  data_envio_fornecedor: string
  previsao_retorno_fornecedor: string
  data_retorno_fornecedor: string
  previsao_entrega_cliente: string
  observacoes: string
  observacoes_fornecedor: string
  numero_nf_envio: string
  created_at: string
  pedido_id: string
  item_id: string
  fornecedor_id: string
  pedidos: {
    numero_pedido: string
    clientes: { nome: string; endereco: string; numero: string; cidade: string; estado: string; telefone: string }
    profissionais: { nome: string; tipo: string } | null
  }
  fornecedores: { nome_fantasia: string; razao_social: string } | null
  itens_pedido: { descricao: string; quantidade: number; numero_nf: string } | null
}

interface Historico {
  id: string
  tipo: string
  descricao: string
  usuario_nome: string
  created_at: string
}

const STATUS_COR: Record<string, { bg: string; color: string; label: string }> = {
  aberta: { bg: '#FAECE7', color: '#712B13', label: 'Aberta' },
  aguardando_retirada: { bg: '#FAEEDA', color: '#633806', label: 'Aguard. retirada' },
  em_reparo: { bg: '#E6F1FB', color: '#0C447C', label: 'Em reparo' },
  enviado_fornecedor: { bg: '#EEEDFE', color: '#3C3489', label: 'No fornecedor' },
  aguardando_devolucao: { bg: '#FAEEDA', color: '#633806', label: 'Aguard. devolução' },
  resolvida: { bg: '#EAF3DE', color: '#27500A', label: 'Resolvida' },
  cancelada: { bg: '#f0efe9', color: '#888', label: 'Cancelada' },
}

function EditableDateCard({ label, value, highlight, onSave }: { label: string; value: string | null; highlight?: boolean; onSave: (val: string) => void }) {
  const [editando, setEditando] = useState(false)
  const [valorLocal, setValorLocal] = useState(value || '')
  const formatted = value ? new Date(value + 'T12:00:00').toLocaleDateString('pt-BR') : '—'
  const isPast = value && new Date(value) < new Date() && highlight
  function confirmar() {
    setEditando(false)
    if (valorLocal !== (value || '')) onSave(valorLocal)
  }
  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: `0.5px solid ${editando ? '#C9A84C' : isPast ? '#f0c0c0' : '#e8e7e3'}`, padding: '14px 16px', cursor: editando ? 'default' : 'pointer' }}
      onClick={() => { if (!editando) { setValorLocal(value || ''); setEditando(true) } }}>
      <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', justifyContent: 'space-between' }}>
        {label}
        {!editando && <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round"><path d="M11 2l3 3-9 9H2v-3l9-9z"/></svg>}
      </div>
      {editando ? (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
          <input type="date" value={valorLocal} onChange={e => setValorLocal(e.target.value)} autoFocus
            onKeyDown={e => { if (e.key === 'Enter') confirmar(); if (e.key === 'Escape') setEditando(false) }}
            style={{ flex: 1, padding: '4px 8px', borderRadius: '6px', border: '0.5px solid #C9A84C', fontSize: '13px', outline: 'none' }} />
          <button onClick={confirmar} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: '#C9A84C', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>✓</button>
          <button onClick={() => setEditando(false)} style={{ padding: '4px 8px', borderRadius: '6px', border: '0.5px solid #e0deda', background: '#fff', color: '#888', fontSize: '12px', cursor: 'pointer' }}>✕</button>
        </div>
      ) : (
        <div style={{ fontSize: '16px', fontWeight: '500', color: isPast ? '#A32D2D' : '#1a1a2e' }}>{formatted}</div>
      )}
    </div>
  )
}

function EditableTextCard({ label, value, multiline, onSave }: { label: string; value: string | null; multiline?: boolean; onSave: (val: string) => void }) {
  const [editando, setEditando] = useState(false)
  const [valorLocal, setValorLocal] = useState(value || '')
  function confirmar() {
    setEditando(false)
    if (valorLocal !== (value || '')) onSave(valorLocal)
  }
  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: `0.5px solid ${editando ? '#C9A84C' : '#e8e7e3'}`, padding: '16px', cursor: editando ? 'default' : 'pointer' }}
      onClick={() => { if (!editando) { setValorLocal(value || ''); setEditando(true) } }}>
      <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', justifyContent: 'space-between' }}>
        {label}
        {!editando && <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round"><path d="M11 2l3 3-9 9H2v-3l9-9z"/></svg>}
      </div>
      {editando ? (
        <div onClick={e => e.stopPropagation()}>
          {multiline ? (
            <textarea value={valorLocal} onChange={e => setValorLocal(e.target.value)} autoFocus rows={3}
              style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '0.5px solid #C9A84C', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'sans-serif', lineHeight: '1.6', color: '#1a1a2e' }} />
          ) : (
            <input value={valorLocal} onChange={e => setValorLocal(e.target.value)} autoFocus
              onKeyDown={e => { if (e.key === 'Enter') confirmar(); if (e.key === 'Escape') setEditando(false) }}
              style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '0.5px solid #C9A84C', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
          )}
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button onClick={() => setEditando(false)} style={{ padding: '5px 12px', borderRadius: '7px', border: '0.5px solid #e0deda', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#888' }}>Cancelar</button>
            <button onClick={confirmar} style={{ padding: '5px 14px', borderRadius: '7px', border: 'none', background: '#1a1a2e', color: '#C9A84C', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>Salvar</button>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '13px', color: value ? '#1a1a2e' : '#ccc', lineHeight: '1.6' }}>{value || 'Clique para editar...'}</div>
      )}
    </div>
  )
}

export default function ATPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [at, setAt] = useState<AT | null>(null)
  const [historico, setHistorico] = useState<Historico[]>([])
  const [loading, setLoading] = useState(true)
  const [fornecedores, setFornecedores] = useState<{ id: string; nome_fantasia: string }[]>([])

  // Action modals
  const [showProcessoModal, setShowProcessoModal] = useState(false)
  const [showFornecedorModal, setShowFornecedorModal] = useState(false)
  const [showRetornoModal, setShowRetornoModal] = useState(false)
  const [showResolvidaModal, setShowResolvidaModal] = useState(false)
  const [showCancelarModal, setShowCancelarModal] = useState(false)
  const [showExcluirModal, setShowExcluirModal] = useState(false)

  const [processoObs, setProcessoObs] = useState('')
  const [resolvidaObs, setResolvidaObs] = useState('')
  const [cancelarObs, setCancelarObs] = useState('')

  const [fornecedorForm, setFornecedorForm] = useState({
    fornecedor_id: '',
    data_envio_fornecedor: '',
    previsao_retorno_fornecedor: '',
    numero_nf_envio: '',
    observacoes_fornecedor: '',
  })
  const [retornoForm, setRetornoForm] = useState({
    data_retorno_fornecedor: '',
    previsao_entrega_cliente: '',
    observacoes: '',
  })

  useEffect(() => {
    buscarAT()
    buscarFornecedores()
  }, [id])

  useEffect(() => {
    if (at?.pedido_id) buscarHistorico()
  }, [at?.pedido_id])

  async function buscarAT() {
    const { data, error } = await supabase
      .from('assistencias_tecnicas')
      .select('*, pedidos(numero_pedido, clientes(nome, endereco, numero, cidade, estado, telefone), profissionais(nome, tipo)), fornecedores(nome_fantasia, razao_social)')
      .eq('id', id)
      .single()
    if (error) { console.error('buscarAT error:', error.message); setLoading(false); return }

    // Busca item separadamente para evitar falha silenciosa no join
    const atData = data as unknown as AT
    if (atData.item_id) {
      const { data: itemData } = await supabase
        .from('itens_pedido')
        .select('descricao, quantidade, numero_nf')
        .eq('id', atData.item_id)
        .single()
      if (itemData) (atData as any).itens_pedido = itemData
    }

    setAt(atData)
    setLoading(false)
  }

  async function buscarHistorico(pedidoId?: string) {
    const pid = pedidoId || at?.pedido_id
    if (!pid) return
    const { data } = await supabase
      .from('historico_alteracoes')
      .select('*')
      .eq('pedido_id', pid)
      .eq('tipo', 'at_atualizada')
      .order('created_at', { ascending: false })
      .limit(30)
    setHistorico(data || [])
  }

  async function buscarFornecedores() {
    const { data } = await supabase.from('fornecedores').select('id, nome_fantasia').order('nome_fantasia')
    setFornecedores(data || [])
  }

  async function registrarHistorico(descricao: string, tipo: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('nome').eq('id', user.id).single()
    await supabase.from('historico_alteracoes').insert([{
      pedido_id: at?.pedido_id || null,
      item_id: id,
      usuario_id: user.id,
      usuario_nome: profile?.nome || user.email,
      tipo,
      descricao,
    }])
  }

  async function iniciarProcesso() {
    await supabase.from('assistencias_tecnicas').update({ status: 'em_reparo', observacoes: processoObs || null }).eq('id', id)
    await registrarHistorico(`AT iniciada em processo de reparo interno. ${processoObs ? 'Obs: ' + processoObs : ''}`, 'at_atualizada')
    setShowProcessoModal(false)
    setProcessoObs('')
    buscarAT()
    buscarHistorico()
  }

  async function enviarFornecedor() {
    if (!fornecedorForm.fornecedor_id) return alert('Selecione um fornecedor')
    await supabase.from('assistencias_tecnicas').update({
      status: 'enviado_fornecedor',
      fornecedor_id: fornecedorForm.fornecedor_id,
      data_envio_fornecedor: fornecedorForm.data_envio_fornecedor || null,
      previsao_retorno_fornecedor: fornecedorForm.previsao_retorno_fornecedor || null,
      numero_nf_envio: fornecedorForm.numero_nf_envio || null,
      observacoes_fornecedor: fornecedorForm.observacoes_fornecedor || null,
    }).eq('id', id)
    await registrarHistorico(`AT enviada ao fornecedor. ${fornecedorForm.observacoes_fornecedor ? 'Obs: ' + fornecedorForm.observacoes_fornecedor : ''}`, 'at_atualizada')
    setShowFornecedorModal(false)
    setFornecedorForm({ fornecedor_id: '', data_envio_fornecedor: '', previsao_retorno_fornecedor: '', numero_nf_envio: '', observacoes_fornecedor: '' })
    buscarAT()
    buscarHistorico()
  }

  async function registrarRetorno() {
    await supabase.from('assistencias_tecnicas').update({
      status: 'aguardando_devolucao',
      data_retorno_fornecedor: retornoForm.data_retorno_fornecedor || null,
      previsao_entrega_cliente: retornoForm.previsao_entrega_cliente || null,
      observacoes: retornoForm.observacoes || null,
    }).eq('id', id)
    await registrarHistorico(`Retorno do fornecedor registrado. ${retornoForm.observacoes ? 'Obs: ' + retornoForm.observacoes : ''}`, 'at_atualizada')
    setShowRetornoModal(false)
    setRetornoForm({ data_retorno_fornecedor: '', previsao_entrega_cliente: '', observacoes: '' })
    buscarAT()
    buscarHistorico()
  }

  async function marcarResolvida() {
    await supabase.from('assistencias_tecnicas').update({ status: 'resolvida', observacoes: resolvidaObs || null }).eq('id', id)
    await registrarHistorico(`AT marcada como resolvida. ${resolvidaObs ? 'Obs: ' + resolvidaObs : ''}`, 'at_atualizada')
    setShowResolvidaModal(false)
    setResolvidaObs('')
    buscarAT()
    buscarHistorico()
  }

  async function excluirAT() {
    await registrarHistoricoGlobal({ tipo: 'at_excluida', descricao: `AT ${at?.numero_at} excluída permanentemente`, pedidoId: at?.pedido_id })
    const { error } = await supabase.from('assistencias_tecnicas').delete().eq('id', id)
    if (error) return alert('Erro ao excluir: ' + error.message)
    window.location.href = '/assistencia'
  }

  const CAMPO_LABEL: Record<string, string> = {
    data_retirada_agendada: 'Data retirada',
    data_envio_fornecedor: 'Envio fornecedor',
    previsao_retorno_fornecedor: 'Previsão retorno',
    data_retorno_fornecedor: 'Retorno efetivo',
    previsao_entrega_cliente: 'Previsão entrega',
    descricao_problema: 'Descrição do problema',
    observacoes: 'Observações gerais',
    observacoes_fornecedor: 'Observações fornecedor',
  }

  async function atualizarCampo(campo: string, valor: string) {
    await supabase.from('assistencias_tecnicas').update({ [campo]: valor || null }).eq('id', id)
    await registrarHistorico(`${CAMPO_LABEL[campo] || campo} atualizado`, 'at_atualizada')
    buscarAT()
    buscarHistorico()
  }

  async function cancelarAT() {
    await supabase.from('assistencias_tecnicas').update({ status: 'cancelada', observacoes: cancelarObs || null }).eq('id', id)
    await registrarHistorico(`AT cancelada. ${cancelarObs ? 'Motivo: ' + cancelarObs : ''}`, 'at_atualizada')
    setShowCancelarModal(false)
    setCancelarObs('')
    buscarAT()
    buscarHistorico()
  }

  const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }
  const labelStyle = { fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.4px', display: 'block' as const }

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#f7f6f3' }}>
      <Sidebar ativa="/assistencia" />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '14px' }}>Carregando...</div>
    </div>
  )

  if (!at) return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#f7f6f3' }}>
      <Sidebar ativa="/assistencia" />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '14px' }}>AT não encontrada.</div>
    </div>
  )

  const status = STATUS_COR[at.status] || { bg: '#f0efe9', color: '#888', label: at.status }
  const nomeCliente = at.pedidos?.clientes?.nome || '—'
  const profissional = at.pedidos?.profissionais

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#f7f6f3' }}>
      <Sidebar ativa="/assistencia" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div style={{ height: '52px', background: '#fff', borderBottom: '0.5px solid #e8e7e3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a href="/assistencia" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>← Assistências</a>
            <span style={{ color: '#ddd' }}>/</span>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a2e' }}>{at.numero_at || 'AT'}</span>
          </div>
          <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '8px', background: status.bg, color: status.color, fontWeight: '500' }}>
            {status.label}
          </span>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '24px', display: 'flex', gap: '20px' }}>
          {/* Left column */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
            {/* Header dark card */}
            <div style={{ background: '#1a1a2e', borderRadius: '14px', padding: '20px 24px' }}>
              <div style={{ fontSize: '11px', color: '#6a6a8a', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Assistência Técnica</div>
              <div style={{ fontSize: '20px', fontWeight: '500', color: '#fff', marginBottom: '8px' }}>{at.numero_at || '—'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#6a6a8a', marginBottom: '3px' }}>Pedido</div>
                  <a href={`/pedidos/${at.pedido_id}`} style={{ fontSize: '13px', color: '#C9A84C', fontWeight: '500', textDecoration: 'none' }}>
                    {at.pedidos?.numero_pedido || '—'}
                  </a>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#6a6a8a', marginBottom: '3px' }}>Cliente</div>
                  <div style={{ fontSize: '13px', color: '#fff' }}>{nomeCliente}</div>
                  {at.pedidos?.clientes?.cidade && <div style={{ fontSize: '11px', color: '#4a4a6a' }}>{at.pedidos.clientes.cidade}, {at.pedidos.clientes.estado}</div>}
                </div>
                {at.itens_pedido && (
                  <div>
                    <div style={{ fontSize: '11px', color: '#6a6a8a', marginBottom: '3px' }}>Item</div>
                    <div style={{ fontSize: '13px', color: '#fff' }}>{at.itens_pedido.descricao}</div>
                    <div style={{ fontSize: '11px', color: '#4a4a6a' }}>Qtd: {at.itens_pedido.quantidade}{at.itens_pedido.numero_nf ? ` · NF ${at.itens_pedido.numero_nf}` : ''}</div>
                  </div>
                )}
                {at.fornecedores && (
                  <div>
                    <div style={{ fontSize: '11px', color: '#6a6a8a', marginBottom: '3px' }}>Fornecedor</div>
                    <div style={{ fontSize: '13px', color: '#fff' }}>{at.fornecedores.nome_fantasia || at.fornecedores.razao_social}</div>
                  </div>
                )}
                {profissional && (
                  <div>
                    <div style={{ fontSize: '11px', color: '#6a6a8a', marginBottom: '3px' }}>{profissional.tipo}</div>
                    <div style={{ fontSize: '13px', color: '#fff' }}>{profissional.nome}</div>
                  </div>
                )}
                {at.numero_nf_envio && (
                  <div>
                    <div style={{ fontSize: '11px', color: '#6a6a8a', marginBottom: '3px' }}>NF envio</div>
                    <div style={{ fontSize: '13px', color: '#fff' }}>{at.numero_nf_envio}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Date cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', padding: '14px 16px' }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Abertura</div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a2e' }}>{at.created_at ? new Date(at.created_at).toLocaleDateString('pt-BR') : '—'}</div>
              </div>
              <EditableDateCard label="Data retirada" value={at.data_retirada_agendada} onSave={v => atualizarCampo('data_retirada_agendada', v)} />
              <EditableDateCard label="Envio fornecedor" value={at.data_envio_fornecedor} onSave={v => atualizarCampo('data_envio_fornecedor', v)} />
              <EditableDateCard label="Previsão retorno" value={at.previsao_retorno_fornecedor} highlight onSave={v => atualizarCampo('previsao_retorno_fornecedor', v)} />
              <EditableDateCard label="Retorno efetivo" value={at.data_retorno_fornecedor} onSave={v => atualizarCampo('data_retorno_fornecedor', v)} />
              <EditableDateCard label="Previsão entrega" value={(at as any).previsao_entrega_cliente} highlight onSave={v => atualizarCampo('previsao_entrega_cliente', v)} />
            </div>

            {/* Problema */}
            <EditableTextCard label="Descrição do problema" value={at.descricao_problema} multiline onSave={v => atualizarCampo('descricao_problema', v)} />

            {/* Observações */}
            <EditableTextCard label="Observações gerais" value={at.observacoes} multiline onSave={v => atualizarCampo('observacoes', v)} />
            <EditableTextCard label="Observações fornecedor" value={at.observacoes_fornecedor} multiline onSave={v => atualizarCampo('observacoes_fornecedor', v)} />

            {/* Address if retirada */}
            {at.requer_retirada && (
              <EditableTextCard label="Endereço de retirada" value={at.endereco_retirada} onSave={v => atualizarCampo('endereco_retirada', v)} />
            )}
          </div>

          {/* Right column — actions + history */}
          <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Action buttons */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Ações</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['aberta', 'aguardando_retirada'].includes(at.status) && (
                  <button onClick={() => setShowProcessoModal(true)} style={{ padding: '9px 14px', borderRadius: '8px', border: 'none', background: '#E6F1FB', color: '#0C447C', fontSize: '13px', fontWeight: '500', cursor: 'pointer', textAlign: 'left' as const }}>
                    Em processo interno
                  </button>
                )}
                {['aberta', 'em_reparo'].includes(at.status) && (
                  <button onClick={() => setShowFornecedorModal(true)} style={{ padding: '9px 14px', borderRadius: '8px', border: 'none', background: '#EEEDFE', color: '#3C3489', fontSize: '13px', fontWeight: '500', cursor: 'pointer', textAlign: 'left' as const }}>
                    Enviar ao fornecedor
                  </button>
                )}
                {at.status === 'enviado_fornecedor' && (
                  <button onClick={() => setShowRetornoModal(true)} style={{ padding: '9px 14px', borderRadius: '8px', border: 'none', background: '#FAEEDA', color: '#633806', fontSize: '13px', fontWeight: '500', cursor: 'pointer', textAlign: 'left' as const }}>
                    Registrar retorno
                  </button>
                )}
                {['em_reparo', 'aguardando_devolucao'].includes(at.status) && (
                  <button onClick={() => setShowResolvidaModal(true)} style={{ padding: '9px 14px', borderRadius: '8px', border: 'none', background: '#EAF3DE', color: '#27500A', fontSize: '13px', fontWeight: '500', cursor: 'pointer', textAlign: 'left' as const }}>
                    Marcar como resolvida
                  </button>
                )}
                {!['resolvida', 'cancelada'].includes(at.status) && (
                  <button onClick={() => setShowCancelarModal(true)} style={{ padding: '9px 14px', borderRadius: '8px', border: '0.5px solid #f0efe9', background: '#fff', color: '#888', fontSize: '13px', cursor: 'pointer', textAlign: 'left' as const }}>
                    Cancelar AT
                  </button>
                )}
                <button onClick={() => setShowExcluirModal(true)} style={{ padding: '9px 14px', borderRadius: '8px', border: '0.5px solid #f0c0c0', background: '#FCEBEB', color: '#791F1F', fontSize: '13px', cursor: 'pointer', textAlign: 'left' as const }}>
                  Excluir AT
                </button>
              </div>
            </div>

            {/* History */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', padding: '16px', flex: 1 }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Histórico</div>
              {historico.length === 0 && <div style={{ fontSize: '12px', color: '#ccc' }}>Nenhuma ação registrada.</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {historico.map(h => (
                  <div key={h.id} style={{ borderLeft: '2px solid #f0efe9', paddingLeft: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#1a1a2e', marginBottom: '2px' }}>{h.descricao}</div>
                    <div style={{ fontSize: '11px', color: '#aaa' }}>
                      {h.usuario_nome} · {new Date(h.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Processo modal */}
      {showProcessoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '420px' }}>
            <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: '16px' }}>Iniciar processo interno</div>
            <label style={labelStyle}>Observação</label>
            <textarea value={processoObs} onChange={e => setProcessoObs(e.target.value)} rows={3}
              style={{ ...inputStyle, resize: 'vertical' as const }} placeholder="Descreva o que será feito internamente..." />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={() => setShowProcessoModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
              <button onClick={iniciarProcesso} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#1a1a2e', color: '#C9A84C', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Fornecedor modal */}
      {showFornecedorModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '460px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: '16px' }}>Enviar ao fornecedor</div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Fornecedor *</label>
              <select value={fornecedorForm.fornecedor_id} onChange={e => setFornecedorForm({ ...fornecedorForm, fornecedor_id: e.target.value })} style={inputStyle}>
                <option value="">Selecione...</option>
                {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome_fantasia}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Data de envio</label>
              <input type="date" value={fornecedorForm.data_envio_fornecedor} onChange={e => setFornecedorForm({ ...fornecedorForm, data_envio_fornecedor: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Previsão de retorno</label>
              <input type="date" value={fornecedorForm.previsao_retorno_fornecedor} onChange={e => setFornecedorForm({ ...fornecedorForm, previsao_retorno_fornecedor: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>NF de envio</label>
              <input value={fornecedorForm.numero_nf_envio} onChange={e => setFornecedorForm({ ...fornecedorForm, numero_nf_envio: e.target.value })} style={inputStyle} placeholder="Número da NF" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Observações</label>
              <textarea value={fornecedorForm.observacoes_fornecedor} onChange={e => setFornecedorForm({ ...fornecedorForm, observacoes_fornecedor: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowFornecedorModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
              <button onClick={enviarFornecedor} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#1a1a2e', color: '#C9A84C', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Confirmar envio</button>
            </div>
          </div>
        </div>
      )}

      {/* Retorno modal */}
      {showRetornoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '420px' }}>
            <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: '16px' }}>Registrar retorno do fornecedor</div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Data de retorno efetivo</label>
              <input type="date" value={retornoForm.data_retorno_fornecedor} onChange={e => setRetornoForm({ ...retornoForm, data_retorno_fornecedor: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Previsão de entrega ao cliente</label>
              <input type="date" value={retornoForm.previsao_entrega_cliente} onChange={e => setRetornoForm({ ...retornoForm, previsao_entrega_cliente: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Observações</label>
              <textarea value={retornoForm.observacoes} onChange={e => setRetornoForm({ ...retornoForm, observacoes: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRetornoModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
              <button onClick={registrarRetorno} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#1a1a2e', color: '#C9A84C', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Confirmar retorno</button>
            </div>
          </div>
        </div>
      )}

      {/* Resolvida modal */}
      {showResolvidaModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '420px' }}>
            <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: '16px' }}>Marcar como resolvida</div>
            <label style={labelStyle}>Observação final</label>
            <textarea value={resolvidaObs} onChange={e => setResolvidaObs(e.target.value)} rows={3}
              style={{ ...inputStyle, resize: 'vertical' as const }} placeholder="Como foi resolvido?" />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={() => setShowResolvidaModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
              <button onClick={marcarResolvida} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#EAF3DE', color: '#27500A', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Marcar resolvida</button>
            </div>
          </div>
        </div>
      )}

      {/* Excluir modal */}
      {showExcluirModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '380px' }}>
            <div style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a2e', marginBottom: '8px' }}>Excluir AT {at.numero_at}?</div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>Esta ação não pode ser desfeita. A AT será removida permanentemente.</div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowExcluirModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
              <button onClick={excluirAT} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#FCEBEB', color: '#791F1F', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Excluir AT</button>
            </div>
          </div>
        </div>
      )}

      {/* Cancelar modal */}
      {showCancelarModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '420px' }}>
            <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: '16px' }}>Cancelar AT</div>
            <label style={labelStyle}>Motivo do cancelamento</label>
            <textarea value={cancelarObs} onChange={e => setCancelarObs(e.target.value)} rows={3}
              style={{ ...inputStyle, resize: 'vertical' as const }} placeholder="Por que está sendo cancelada?" />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={() => setShowCancelarModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Voltar</button>
              <button onClick={cancelarAT} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#FCEBEB', color: '#791F1F', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Cancelar AT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
