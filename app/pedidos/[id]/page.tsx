'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'
import { use } from 'react'

interface Pedido {
  id: string
  numero_pedido: string
  data_venda: string
  prazo_prometido: string
  status: string
  semaforo: string
  observacoes_gerais: string
  clientes: { nome: string; endereco: string; numero: string; cidade: string; estado: string; telefone: string }
  profissionais: { nome: string; tipo: string } | null
}

interface Item {
  id: string
  descricao: string
  quantidade: number
  medida: string
  tecido: string
  cor: string
  acabamento: string
  observacoes: string
  status: string
  previsao_chegada: string
  apto_entrega: boolean
  tem_at: boolean
  requer_icamento: boolean
  requer_tecido_fornecido: boolean
  tipo: string
  fornecedor_id: string
  data_recebimento: string
  numero_nf: string
  fornecedores: { nome_fantasia: string; razao_social: string }
}

interface Historico {
  id: string
  tipo: string
  descricao: string
  usuario_nome: string
  created_at: string
  item_id: string | null
}

const STATUS_ITEM: Record<string, { label: string; bg: string; color: string }> = {
  aguardando_compra: { label: 'Aguard. compra', bg: '#FAECE7', color: '#712B13' },
  compra_enviada: { label: 'Compra enviada', bg: '#FAEEDA', color: '#633806' },
  compra_confirmada: { label: 'Confirmado', bg: '#FAEEDA', color: '#633806' },
  em_producao: { label: 'Em produção', bg: '#E6F1FB', color: '#0C447C' },
  em_transporte: { label: 'Em transporte', bg: '#FAEEDA', color: '#633806' },
  recebido: { label: 'Recebido', bg: '#EAF3DE', color: '#27500A' },
  conferido_ok: { label: 'Conferido OK', bg: '#EAF3DE', color: '#27500A' },
  conferido_com_problema: { label: 'Com problema', bg: '#FCEBEB', color: '#791F1F' },
  em_at: { label: 'Em AT', bg: '#EEEDFE', color: '#3C3489' },
  apto_entrega: { label: 'Apto entrega', bg: '#EAF3DE', color: '#27500A' },
  entregue: { label: 'Entregue', bg: '#EAF3DE', color: '#27500A' },
}

const SEMAFORO_COLOR: Record<string, string> = {
  verde: '#3B6D11',
  amarelo: '#BA7517',
  vermelho: '#A32D2D',
  azul: '#185FA5',
  roxo: '#534AB7',
}

const itemFormVazio = {
  descricao: '', quantidade: '1', medida: '', tecido: '', cor: '',
  acabamento: '', observacoes: '', fornecedor_id: '', requer_icamento: false,
  requer_tecido_fornecido: false, tipo: 'movel',
  status: 'aguardando_compra', previsao_chegada: '', apto_entrega: false,
  data_recebimento: '', numero_nf: '',
}

export default function CentralPedido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [itens, setItens] = useState<Item[]>([])
  const [historico, setHistorico] = useState<Historico[]>([])
  const [loading, setLoading] = useState(true)
  const [showItemForm, setShowItemForm] = useState(false)
  const [editandoItemId, setEditandoItemId] = useState<string | null>(null)
  const [itemAnterior, setItemAnterior] = useState<Item | null>(null)
  const [fornecedores, setFornecedores] = useState<{ id: string; nome_fantasia: string; razao_social: string }[]>([])
  const [itemForm, setItemForm] = useState(itemFormVazio)
  const [showSemaforo, setShowSemaforo] = useState(false)
  const [atsCount, setAtsCount] = useState(0)
  const [ocorrenciaItemIds, setOcorrenciaItemIds] = useState<Set<string>>(new Set())
  const [showExcluirModal, setShowExcluirModal] = useState(false)
  const [confirmacaoExcluir, setConfirmacaoExcluir] = useState('')
  const [excluindo, setExcluindo] = useState(false)

  useEffect(() => {
    buscarPedido()
    buscarItens()
    buscarFornecedores()
    buscarHistorico()
    buscarATs()
    buscarOcorrencias()
  }, [id])

  async function buscarPedido() {
    const { data } = await supabase
      .from('pedidos')
      .select('*, clientes(nome, endereco, numero, cidade, estado, telefone), profissionais(nome, tipo)')
      .eq('id', id)
      .single()
    setPedido(data)
    setLoading(false)
  }

  async function buscarATs() {
    const { data } = await supabase
      .from('assistencias_tecnicas')
      .select('id')
      .eq('pedido_id', id)
      .in('status', ['aberta', 'aguardando_retirada', 'em_reparo', 'enviado_fornecedor', 'aguardando_devolucao'])
    setAtsCount((data || []).length)
  }

  async function buscarOcorrencias() {
    const { data } = await supabase
      .from('ocorrencias')
      .select('item_id')
      .eq('pedido_id', id)
      .eq('status', 'aberta')
      .not('item_id', 'is', null)
    const ids = new Set((data || []).map((o: any) => o.item_id as string))
    setOcorrenciaItemIds(ids)
  }

  async function salvarSemaforo(cor: string) {
    await supabase.from('pedidos').update({ semaforo: cor }).eq('id', id)
    setPedido(prev => prev ? { ...prev, semaforo: cor } : prev)
    setShowSemaforo(false)
    await registrarHistorico(`Semáforo alterado para ${cor}`, 'pedido_editado')
  }

  async function excluirPedido() {
    if (confirmacaoExcluir !== pedido?.numero_pedido) return
    setExcluindo(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('nome').eq('id', user?.id || '').single()
    await supabase.from('historico_alteracoes').insert([{
      pedido_id: null,
      item_id: null,
      usuario_id: user?.id || null,
      usuario_nome: profile?.nome || user?.email || 'Sistema',
      tipo: 'pedido_excluido',
      descricao: `Pedido ${pedido?.numero_pedido} (${pedido?.clientes?.nome}) foi excluído permanentemente`,
    }])

    await supabase.from('historico_alteracoes').delete().eq('pedido_id', id)
    await supabase.from('itens_pedido').delete().eq('pedido_id', id)
    await supabase.from('assistencias_tecnicas').delete().eq('pedido_id', id)
    await supabase.from('ocorrencias').delete().eq('pedido_id', id)
    await supabase.from('entregas').delete().eq('pedido_id', id)
    const { error } = await supabase.from('pedidos').delete().eq('id', id)
    if (error) { alert('Erro ao excluir: ' + error.message); setExcluindo(false); return }
    window.location.href = '/pedidos'
  }

  async function buscarItens() {
    const { data } = await supabase
      .from('itens_pedido')
      .select('*, fornecedores(nome_fantasia, razao_social)')
      .eq('pedido_id', id)
      .order('created_at')
    setItens(data || [])
  }

  async function buscarFornecedores() {
    const { data } = await supabase
      .from('fornecedores')
      .select('id, nome_fantasia, razao_social')
      .order('nome_fantasia')
    setFornecedores(data || [])
  }

  async function buscarHistorico() {
    const { data } = await supabase
      .from('historico_alteracoes')
      .select('*')
      .eq('pedido_id', id)
      .order('created_at', { ascending: false })
      .limit(30)
    setHistorico(data || [])
  }

  async function registrarHistorico(descricao: string, tipo: string, itemId?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { console.error('historico: sem usuario'); return }
    const { data: profile } = await supabase.from('profiles').select('nome').eq('id', user.id).single()
    const { error } = await supabase.from('historico_alteracoes').insert([{
      pedido_id: id,
      item_id: itemId || null,
      usuario_id: user.id,
      usuario_nome: profile?.nome || user.email,
      tipo,
      descricao,
    }])
    if (error) console.error('historico error:', error.message)
  }

  function abrirNovoItem() {
    setEditandoItemId(null)
    setItemAnterior(null)
    setItemForm(itemFormVazio)
    setShowItemForm(true)
  }

  function abrirEdicaoItem(item: Item) {
    setEditandoItemId(item.id)
    setItemAnterior(item)
    setItemForm({
      descricao: item.descricao || '',
      quantidade: String(item.quantidade || 1),
      medida: item.medida || '',
      tecido: item.tecido || '',
      cor: item.cor || '',
      acabamento: item.acabamento || '',
      observacoes: item.observacoes || '',
      fornecedor_id: item.fornecedor_id || '',
      requer_icamento: item.requer_icamento || false,
      requer_tecido_fornecido: item.requer_tecido_fornecido || false,
      tipo: item.tipo || 'movel',
      status: item.status || 'aguardando_compra',
      previsao_chegada: item.previsao_chegada || '',
      apto_entrega: item.apto_entrega || false,
      data_recebimento: item.data_recebimento || '',
      numero_nf: item.numero_nf || '',
    })
    setShowItemForm(true)
  }

  async function salvarItem() {
    if (!itemForm.descricao) return alert('Descrição é obrigatória')
    const payload = {
      descricao: itemForm.descricao,
      quantidade: parseInt(itemForm.quantidade) || 1,
      medida: itemForm.medida,
      tecido: itemForm.tecido,
      cor: itemForm.cor,
      acabamento: itemForm.acabamento,
      observacoes: itemForm.observacoes,
      fornecedor_id: itemForm.fornecedor_id || null,
      requer_icamento: itemForm.requer_icamento,
      requer_tecido_fornecido: itemForm.requer_tecido_fornecido,
      tipo: itemForm.tipo || 'movel',
      status: itemForm.status,
      previsao_chegada: itemForm.previsao_chegada || null,
      apto_entrega: itemForm.apto_entrega,
      data_recebimento: itemForm.data_recebimento || null,
      numero_nf: itemForm.numero_nf || null,
    }

    if (editandoItemId) {
      const { error } = await supabase.from('itens_pedido').update(payload).eq('id', editandoItemId)
      if (error) return alert('Erro: ' + error.message)

      const mudancas: string[] = []
      if (itemAnterior?.descricao !== itemForm.descricao) {
        mudancas.push(`Descrição: "${itemAnterior?.descricao}" → "${itemForm.descricao}"`)
      }
      if (itemAnterior?.status !== itemForm.status) {
        mudancas.push(`Status: ${STATUS_ITEM[itemAnterior?.status || '']?.label || itemAnterior?.status} → ${STATUS_ITEM[itemForm.status]?.label || itemForm.status}`)
      }
      if (String(itemAnterior?.quantidade ?? '') !== String(itemForm.quantidade)) {
        mudancas.push(`Quantidade: ${itemAnterior?.quantidade} → ${itemForm.quantidade}`)
      }
      if ((itemAnterior?.medida || '') !== (itemForm.medida || '')) {
        mudancas.push(`Medida: "${itemAnterior?.medida || '—'}" → "${itemForm.medida || '—'}"`)
      }
      if ((itemAnterior?.tecido || '') !== (itemForm.tecido || '')) {
        mudancas.push(`Tecido: "${itemAnterior?.tecido || '—'}" → "${itemForm.tecido || '—'}"`)
      }
      if ((itemAnterior?.cor || '') !== (itemForm.cor || '')) {
        mudancas.push(`Cor: "${itemAnterior?.cor || '—'}" → "${itemForm.cor || '—'}"`)
      }
      if ((itemAnterior?.acabamento || '') !== (itemForm.acabamento || '')) {
        mudancas.push(`Acabamento: "${itemAnterior?.acabamento || '—'}" → "${itemForm.acabamento || '—'}"`)
      }
      if ((itemAnterior?.observacoes || '') !== (itemForm.observacoes || '')) {
        mudancas.push(`Observações alteradas`)
      }
      if ((itemAnterior?.fornecedor_id || '') !== (itemForm.fornecedor_id || '')) {
        const nomeForn = fornecedores.find(f => f.id === itemForm.fornecedor_id)?.nome_fantasia || itemForm.fornecedor_id || '—'
        mudancas.push(`Fornecedor: ${nomeForn}`)
      }
      if ((itemAnterior?.numero_nf || '') !== (itemForm.numero_nf || '')) {
        mudancas.push(`NF: "${itemAnterior?.numero_nf || '—'}" → "${itemForm.numero_nf || '—'}"`)
      }
      if ((itemAnterior?.data_recebimento || '') !== (itemForm.data_recebimento || '')) {
        const dataAntes = itemAnterior?.data_recebimento ? new Date(itemAnterior.data_recebimento + 'T12:00:00').toLocaleDateString('pt-BR') : '—'
        const dataDepois = itemForm.data_recebimento ? new Date(itemForm.data_recebimento + 'T12:00:00').toLocaleDateString('pt-BR') : '—'
        mudancas.push(`Data recebimento: ${dataAntes} → ${dataDepois}`)
      }
      if (itemAnterior?.previsao_chegada !== itemForm.previsao_chegada) {
        const prevAntes = itemAnterior?.previsao_chegada ? new Date(itemAnterior.previsao_chegada + 'T12:00:00').toLocaleDateString('pt-BR') : '—'
        const prevDepois = itemForm.previsao_chegada ? new Date(itemForm.previsao_chegada + 'T12:00:00').toLocaleDateString('pt-BR') : '—'
        mudancas.push(`Previsão chegada: ${prevAntes} → ${prevDepois}`)
      }
      if (itemAnterior?.apto_entrega !== itemForm.apto_entrega) {
        mudancas.push(`Apto entrega: ${itemForm.apto_entrega ? 'Sim' : 'Não'}`)
      }
      if (itemAnterior?.requer_icamento !== itemForm.requer_icamento) {
        mudancas.push(`Içamento: ${itemForm.requer_icamento ? 'Sim' : 'Não'}`)
      }
      const descricao = `Item "${itemForm.descricao}" editado${mudancas.length ? ': ' + mudancas.join(' · ') : ''}`
      await registrarHistorico(descricao, 'item_editado', editandoItemId)
    } else {
      const { error } = await supabase.from('itens_pedido').insert([{ ...payload, pedido_id: id, status: 'aguardando_compra' }])
      if (error) return alert('Erro: ' + error.message)
      await registrarHistorico(`Item "${itemForm.descricao}" adicionado ao pedido`, 'item_adicionado')
    }

    setShowItemForm(false)
    setItemForm(itemFormVazio)
    setEditandoItemId(null)
    setItemAnterior(null)
    buscarItens()
    buscarHistorico()
  }

  const aptos = itens.filter(i => i.apto_entrega).length
  const icamento = itens.filter(i => i.requer_icamento).length

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
        <Sidebar ativa="/pedidos" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>Carregando...</div>
      </div>
    )
  }

  if (!pedido) {
    return (
      <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
        <Sidebar ativa="/pedidos" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>Pedido não encontrado.</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#f7f6f3' }}>
      <Sidebar ativa="/pedidos" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        <div style={{ height: '52px', background: '#fff', borderBottom: '0.5px solid #e8e7e3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a href="/pedidos" style={{ color: '#888', fontSize: '13px', textDecoration: 'none' }}>Voltar</a>
            <span style={{ color: '#ccc' }}>/</span>
            <span style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a2e' }}>Pedido {pedido.numero_pedido}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <div onClick={() => setShowSemaforo(!showSemaforo)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: SEMAFORO_COLOR[pedido.semaforo] || '#888' }} />
              <span style={{ fontSize: '12px', color: '#888' }}>{pedido.semaforo || '—'}</span>
              <span style={{ fontSize: '10px', color: '#ccc' }}>▾</span>
            </div>
            {showSemaforo && (
              <>
                <div onClick={() => setShowSemaforo(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                <div style={{ position: 'absolute', top: '36px', right: 0, background: '#fff', borderRadius: '10px', border: '0.5px solid #e8e7e3', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden', minWidth: '140px' }}>
                  {Object.entries(SEMAFORO_COLOR).map(([cor, hex]) => (
                    <div key={cor} onClick={() => salvarSemaforo(cor)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer', background: pedido.semaforo === cor ? '#f7f6f3' : '#fff', borderBottom: '0.5px solid #f0efe9' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: hex }} />
                      <span style={{ fontSize: '13px', color: '#1a1a2e', textTransform: 'capitalize' }}>{cor}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <button onClick={() => { setShowExcluirModal(true); setConfirmacaoExcluir('') }}
            style={{ padding: '6px 14px', borderRadius: '8px', border: '0.5px solid #f5c6c6', background: '#fff', color: '#A32D2D', fontSize: '12px', cursor: 'pointer' }}>
            Excluir pedido
          </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>

          <div style={{ background: '#1a1a2e', borderRadius: '14px', padding: '20px 24px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#6a6a8a', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Central do Pedido</div>
                <div style={{ fontSize: '20px', fontWeight: '500', color: '#fff', marginBottom: '4px' }}>Pedido {pedido.numero_pedido}</div>
                <div style={{ fontSize: '13px', color: '#8888aa' }}>
                  {pedido.clientes?.nome}
                  {[pedido.clientes?.endereco, pedido.clientes?.cidade, pedido.clientes?.estado].filter(Boolean).length > 0 && (
                    <span style={{ color: '#4a4a6a', marginLeft: '8px' }}>
                      — {[
                          pedido.clientes?.endereco && pedido.clientes?.numero
                            ? `${pedido.clientes.endereco}, ${pedido.clientes.numero}`
                            : pedido.clientes?.endereco,
                          pedido.clientes?.cidade,
                          pedido.clientes?.estado,
                        ].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>
                {pedido.profissionais && (
                  <div style={{ fontSize: '12px', color: '#6a6a8a', marginTop: '6px' }}>
                    <span style={{ color: '#4a4a6a' }}>{pedido.profissionais.tipo}:</span> {pedido.profissionais.nome}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#6a6a8a', marginBottom: '4px' }}>Prazo prometido</div>
                <div style={{ fontSize: '15px', fontWeight: '500', color: '#C9A84C' }}>
                  {pedido.prazo_prometido ? new Date(pedido.prazo_prometido + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                </div>
                <div style={{ fontSize: '11px', color: '#6a6a8a', marginTop: '4px' }}>
                  Venda: {pedido.data_venda ? new Date(pedido.data_venda + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                </div>
              </div>
            </div>
            {pedido.observacoes_gerais && (
              <div style={{ marginTop: '12px', padding: '10px 14px', background: '#252540', borderRadius: '8px', fontSize: '12px', color: '#8888aa' }}>
                {pedido.observacoes_gerais}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
            {[
              { label: 'Total de itens', value: itens.length, color: '#1a1a2e' },
              { label: 'Aptos p/ entrega', value: aptos, color: '#3B6D11' },
              { label: 'Com AT ativa', value: atsCount, color: '#185FA5' },
              { label: 'Requer içamento', value: icamento, color: '#BA7517' },
            ].map(card => (
              <div key={card.label} style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', padding: '14px' }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>{card.label}</div>
                <div style={{ fontSize: '24px', fontWeight: '500', color: card.color }}>{card.value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '0.5px solid #f0efe9' }}>
              <span style={{ fontSize: '12px', fontWeight: '500', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Produtos do pedido</span>
              <button onClick={abrirNovoItem} style={{ background: '#1a1a2e', color: '#C9A84C', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
                + Adicionar item
              </button>
            </div>

            {itens.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Nenhum item adicionado ainda.</div>
            )}

            {itens.length > 0 && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 110px 120px 90px 40px 72px', padding: '8px 16px', background: '#f7f6f3', fontSize: '10px', fontWeight: '500', color: '#888', textTransform: 'uppercase', letterSpacing: '0.4px', gap: '8px' }}>
                  <span>Item</span><span>Qtd</span><span>Fornecedor</span><span>Status</span><span>Previsão</span><span>Apto</span><span></span>
                </div>
                {itens.map((item, i) => (
                  <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 50px 110px 120px 90px 40px 72px', padding: '12px 16px', borderTop: '0.5px solid #f0efe9', alignItems: 'center', gap: '8px', background: item.tipo === 'tecido' ? '#F5F0FF' : item.tipo === 'outro' ? '#F5F5F5' : i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {item.tipo === 'tecido' && (
                          <span style={{ background: '#EEEDFE', color: '#3C3489', padding: '1px 7px', borderRadius: '6px', fontSize: '10px', fontWeight: '500', flexShrink: 0 }}>Tecido</span>
                        )}
                        <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>{item.descricao}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                        {[item.medida, item.tecido, item.cor, item.acabamento].filter(Boolean).join(' · ')}
                        {item.requer_icamento && (
                          <span style={{ marginLeft: '6px', background: '#FAEEDA', color: '#633806', padding: '1px 6px', borderRadius: '6px', fontSize: '10px' }}>Içamento</span>
                        )}
                        {item.requer_tecido_fornecido && (
                          <span style={{ marginLeft: '6px', background: '#EEEDFE', color: '#3C3489', padding: '1px 6px', borderRadius: '6px', fontSize: '10px' }}>Tecido a enviar</span>
                        )}
                        {ocorrenciaItemIds.has(item.id) && (
                          <span style={{ marginLeft: '6px', background: '#FCEBEB', color: '#791F1F', padding: '1px 6px', borderRadius: '6px', fontSize: '10px' }}>Ocorrência aberta</span>
                        )}
                      </div>
                      {(item.numero_nf || item.data_recebimento) && (
                        <div style={{ fontSize: '11px', color: '#C9A84C', marginTop: '2px' }}>
                          {item.numero_nf && <span>NF {item.numero_nf}</span>}
                          {item.numero_nf && item.data_recebimento && <span> · </span>}
                          {item.data_recebimento && <span>Recebido: {new Date(item.data_recebimento + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '13px', color: '#555' }}>{item.quantidade}</span>
                    <span style={{ fontSize: '11px', color: '#555' }}>{item.fornecedores?.nome_fantasia || item.fornecedores?.razao_social || '—'}</span>
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '8px', fontWeight: '500', background: STATUS_ITEM[item.status]?.bg || '#f0efe9', color: STATUS_ITEM[item.status]?.color || '#555' }}>
                      {STATUS_ITEM[item.status]?.label || item.status}
                    </span>
                    <span style={{ fontSize: '11px', color: '#555' }}>
                      {item.previsao_chegada ? new Date(item.previsao_chegada + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                    </span>
                    <span style={{ fontSize: '13px', textAlign: 'center', color: item.apto_entrega ? '#3B6D11' : '#ccc' }}>
                      {item.apto_entrega ? '✓' : '—'}
                    </span>
                    <button onClick={() => abrirEdicaoItem(item)} style={{ padding: '5px 12px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#555' }}>
                      Editar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #f0efe9' }}>
              <span style={{ fontSize: '12px', fontWeight: '500', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Histórico de alterações</span>
            </div>
            {historico.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>Nenhuma alteração registrada ainda.</div>
            ) : (
              <div style={{ padding: '8px 0' }}>
                {historico.map((h, i) => (
                  <div key={h.id} style={{ display: 'flex', gap: '12px', padding: '10px 16px', borderTop: i > 0 ? '0.5px solid #f7f6f3' : 'none', alignItems: 'flex-start' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '11px', color: '#C9A84C', fontWeight: '600' }}>
                      {h.usuario_nome?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', color: '#1a1a2e' }}>{h.descricao}</div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                        {h.usuario_nome} · {new Date(h.created_at).toLocaleDateString('pt-BR')} às {new Date(h.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {showItemForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '520px', maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a2e' }}>{editandoItemId ? 'Editar item' : 'Adicionar item ao pedido'}</span>
              <button onClick={() => setShowItemForm(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Tipo do item</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[{ value: 'movel', label: 'Móvel' }, { value: 'tecido', label: 'Tecido' }, { value: 'outro', label: 'Outro' }].map(opt => (
                  <button key={opt.value} onClick={() => setItemForm({ ...itemForm, tipo: opt.value })}
                    style={{ flex: 1, padding: '7px', borderRadius: '8px', border: `1px solid ${itemForm.tipo === opt.value ? '#1a1a2e' : '#e8e7e3'}`, background: itemForm.tipo === opt.value ? '#1a1a2e' : '#fff', color: itemForm.tipo === opt.value ? '#C9A84C' : '#555', fontSize: '13px', cursor: 'pointer', fontWeight: itemForm.tipo === opt.value ? '500' : '400' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {([
              { label: 'Descrição do item *', field: 'descricao' },
              { label: 'Quantidade', field: 'quantidade' },
              { label: 'Medida', field: 'medida' },
              { label: 'Tecido', field: 'tecido' },
              { label: 'Cor', field: 'cor' },
              { label: 'Acabamento', field: 'acabamento' },
              { label: 'Observações', field: 'observacoes' },
            ] as { label: string; field: keyof typeof itemForm }[]).map(({ label, field }) => (
              <div key={field} style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
                <input value={itemForm[field] as string} onChange={e => setItemForm({ ...itemForm, [field]: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Fornecedor</div>
              <select value={itemForm.fornecedor_id} onChange={e => setItemForm({ ...itemForm, fornecedor_id: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                <option value="">Selecione o fornecedor</option>
                {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome_fantasia || f.razao_social}</option>)}
              </select>
            </div>

            {editandoItemId && (
              <>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Status</div>
                  <select value={itemForm.status} onChange={e => setItemForm({ ...itemForm, status: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                    {Object.entries(STATUS_ITEM).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Previsão de chegada</div>
                  <input type="date" value={itemForm.previsao_chegada} onChange={e => setItemForm({ ...itemForm, previsao_chegada: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                </div>

                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" id="apto" checked={itemForm.apto_entrega} onChange={e => setItemForm({ ...itemForm, apto_entrega: e.target.checked })} />
                  <label htmlFor="apto" style={{ fontSize: '13px', color: '#555', cursor: 'pointer' }}>Apto para entrega</label>
                </div>
              </>
            )}

            <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="icamento" checked={itemForm.requer_icamento} onChange={e => setItemForm({ ...itemForm, requer_icamento: e.target.checked })} />
              <label htmlFor="icamento" style={{ fontSize: '13px', color: '#555', cursor: 'pointer' }}>Requer içamento na entrega</label>
            </div>

            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="tecido_fornecido" checked={itemForm.requer_tecido_fornecido} onChange={e => setItemForm({ ...itemForm, requer_tecido_fornecido: e.target.checked })} />
              <label htmlFor="tecido_fornecido" style={{ fontSize: '13px', color: '#555', cursor: 'pointer' }}>Requer envio de tecido fornecido ao fornecedor</label>
            </div>

            <div style={{ borderTop: '0.5px solid #f0efe9', paddingTop: '14px', marginBottom: '12px' }}>
              <div style={{ fontSize: '10px', color: '#888', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '500' }}>Recebimento</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Número da NF</div>
                  <input value={itemForm.numero_nf} onChange={e => setItemForm({ ...itemForm, numero_nf: e.target.value })} placeholder="Ex: 1234"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Data de recebimento</div>
                  <input type="date" value={itemForm.data_recebimento} onChange={e => setItemForm({ ...itemForm, data_recebimento: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowItemForm(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
              <button onClick={salvarItem} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#1a1a2e', color: '#C9A84C', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                {editandoItemId ? 'Salvar alterações' : 'Salvar item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showExcluirModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '420px' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#A32D2D', marginBottom: '8px' }}>Excluir pedido {pedido.numero_pedido}</div>
            <p style={{ fontSize: '13px', color: '#555', marginBottom: '6px', lineHeight: '1.5' }}>
              Esta ação é <strong>irreversível</strong>. Todos os itens, histórico, ATs, ocorrências e entregas vinculados a este pedido serão excluídos permanentemente.
            </p>
            <p style={{ fontSize: '13px', color: '#555', marginBottom: '16px', lineHeight: '1.5' }}>
              Para confirmar, digite o número do pedido: <strong>{pedido.numero_pedido}</strong>
            </p>
            <input
              value={confirmacaoExcluir}
              onChange={e => setConfirmacaoExcluir(e.target.value)}
              placeholder={`Digite ${pedido.numero_pedido} para confirmar`}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${confirmacaoExcluir === pedido.numero_pedido ? '#A32D2D' : '#e8e7e3'}`, fontSize: '13px', outline: 'none', boxSizing: 'border-box', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowExcluirModal(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>
                Cancelar
              </button>
              <button onClick={excluirPedido} disabled={confirmacaoExcluir !== pedido.numero_pedido || excluindo}
                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: confirmacaoExcluir === pedido.numero_pedido ? '#A32D2D' : '#e8e7e3', color: confirmacaoExcluir === pedido.numero_pedido ? '#fff' : '#aaa', fontSize: '13px', fontWeight: '500', cursor: confirmacaoExcluir === pedido.numero_pedido ? 'pointer' : 'not-allowed' }}>
                {excluindo ? 'Excluindo...' : 'Excluir permanentemente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
