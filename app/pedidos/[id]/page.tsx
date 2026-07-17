'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { registrarHistorico } from '../../lib/historico'
import Sidebar from '../../components/Sidebar'
import { LOGO_DARK } from '../../lib/logos'
import { use } from 'react'

interface Pedido {
  id: string
  numero_pedido: string
  data_venda: string
  prazo_prometido: string
  status: string
  semaforo: string
  observacoes_gerais: string
  tipo_documento: string | null
  numero_documento: string | null
  data_entrega: string | null
  status_pagamento: string | null
  observacao_pagamento: string | null
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
  requer_retirada_loja: boolean
  requer_higienizacao: boolean
  requer_impermeabilizacao: boolean
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

const SEMAFORO_LABEL: Record<string, string> = {
  verde: 'No prazo',
  amarelo: 'Atenção',
  vermelho: 'Atrasado',
  azul: 'Aguardando cliente',
  roxo: 'Aguardando fornecedor',
}

const itemFormVazio = {
  descricao: '', quantidade: '1', medida: '', tecido: '', cor: '',
  acabamento: '', observacoes: '', fornecedor_id: '', requer_icamento: false,
  requer_tecido_fornecido: false,
  requer_retirada_loja: false,
  requer_higienizacao: false,
  requer_impermeabilizacao: false,
  tipo: 'movel',
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
  const [atItemIds, setAtItemIds] = useState<Set<string>>(new Set())
  const [showExcluirModal, setShowExcluirModal] = useState(false)
  const [confirmacaoExcluir, setConfirmacaoExcluir] = useState('')
  const [excluindo, setExcluindo] = useState(false)
  const [salvandoItem, setSalvandoItem] = useState(false)
  const [pagamento, setPagamento] = useState({ status_pagamento: 'pendente', observacao_pagamento: '' })
  const [docForm, setDocForm] = useState({ tipo_documento: 'NF', numero_documento: '' })
  const [editandoDoc, setEditandoDoc] = useState(false)
  const [salvandoDoc, setSalvandoDoc] = useState(false)
  const [pagamentoAberto, setPagamentoAberto] = useState(false)
  const [historicoAberto, setHistoricoAberto] = useState(false)
  const [historicoItemId, setHistoricoItemId] = useState<string | null>(null)
  const [historicoItens, setHistoricoItens] = useState<any[]>([])

  useEffect(() => {
    buscarPedido()
    buscarItens()
    buscarFornecedores()
    buscarHistorico()
    buscarATs()
    buscarOcorrencias()
    buscarATsItens()
  }, [id])

  async function buscarPedido() {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, clientes(nome, endereco, numero, cidade, estado, telefone), profissionais(nome, tipo)')
      .eq('id', id)
      .single()
    if (error) console.error('Erro ao buscar pedido:', error)
    if (data) {
      setPagamento({
        status_pagamento: (data as any).status_pagamento || 'pendente',
        observacao_pagamento: (data as any).observacao_pagamento || '',
      })
    }
    setPedido(data)
    setLoading(false)
  }

  async function salvarPagamento() {
    await supabase.from('pedidos').update({
      status_pagamento: pagamento.status_pagamento,
      observacao_pagamento: pagamento.observacao_pagamento || null,
    }).eq('id', id)
  }

  async function salvarDocumento() {
    if (!docForm.numero_documento.trim()) return
    setSalvandoDoc(true)
    const { error } = await supabase.from('pedidos').update({
      tipo_documento: docForm.tipo_documento,
      numero_documento: docForm.numero_documento.trim(),
    }).eq('id', id)
    setSalvandoDoc(false)
    if (error) { alert('Erro: ' + error.message); return }
    await registrarHistorico({ tipo: 'pedido_editado', descricao: `Documento fiscal: ${docForm.tipo_documento} ${docForm.numero_documento}`, pedidoId: id })
    setEditandoDoc(false)
    buscarPedido()
  }

  async function verificarStatusPedido() {
    const { data: todosItens } = await supabase.from('itens_pedido').select('apto_entrega, status').eq('pedido_id', id)
    if (!todosItens || todosItens.length === 0) return
    const todosAptos = todosItens.every((i: any) => i.apto_entrega === true)
    if (todosAptos) {
      const { data: p } = await supabase.from('pedidos').select('status').eq('id', id).single()
      if (p && p.status !== 'entregue' && p.status !== 'cancelado' && p.status !== 'apto_agendamento') {
        await supabase.from('pedidos').update({ status: 'apto_agendamento' }).eq('id', id)
        await registrarHistorico({ tipo: 'pedido_editado', descricao: 'Status atualizado automaticamente para Apto p/ agendamento (todos os itens prontos)', pedidoId: id })
        buscarPedido()
      }
    }
  }

  async function verHistoricoItem(itemId: string) {
    setHistoricoItemId(itemId)
    const { data } = await supabase.from('historico_itens').select('*').eq('item_id', itemId).order('created_at', { ascending: false })
    setHistoricoItens(data || [])
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

  async function buscarATsItens() {
    const { data } = await supabase
      .from('assistencias_tecnicas')
      .select('item_id')
      .eq('pedido_id', id)
      .in('status', ['aberta', 'aguardando_retirada', 'em_reparo', 'enviado_fornecedor', 'aguardando_devolucao'])
      .not('item_id', 'is', null)
    const ids = new Set((data || []).map((a: any) => a.item_id as string))
    setAtItemIds(ids)
  }

  async function salvarSemaforo(cor: string) {
    await supabase.from('pedidos').update({ semaforo: cor }).eq('id', id)
    setPedido(prev => prev ? { ...prev, semaforo: cor } : prev)
    setShowSemaforo(false)
    await registrarHistorico({ tipo: 'pedido_editado', descricao: `Semáforo alterado para ${cor}`, pedidoId: id })
  }

  async function excluirPedido() {
    if (confirmacaoExcluir !== pedido?.numero_pedido) return
    setExcluindo(true)

    // Nullifica FKs no histórico antes de deletar (preserva os registros, remove o vínculo)
    await supabase.from('historico_alteracoes').update({ pedido_id: null }).eq('pedido_id', id)
    await supabase.from('historico_itens').delete().eq('pedido_id', id)
    const { error: errItens } = await supabase.from('itens_pedido').delete().eq('pedido_id', id)
    if (errItens) { alert('Erro ao excluir itens: ' + errItens.message); setExcluindo(false); return }
    const { error: errATs } = await supabase.from('assistencias_tecnicas').delete().eq('pedido_id', id)
    if (errATs) { alert('Erro ao excluir ATs: ' + errATs.message); setExcluindo(false); return }
    const { error: errOcorrencias } = await supabase.from('ocorrencias').delete().eq('pedido_id', id)
    if (errOcorrencias) { alert('Erro ao excluir ocorrências: ' + errOcorrencias.message); setExcluindo(false); return }
    const { error: errEntregas } = await supabase.from('entregas').delete().eq('pedido_id', id)
    if (errEntregas) { alert('Erro ao excluir entregas: ' + errEntregas.message); setExcluindo(false); return }
    const { error } = await supabase.from('pedidos').delete().eq('id', id)
    if (error) { alert('Erro ao excluir: ' + error.message); setExcluindo(false); return }

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

    window.location.href = '/pedidos'
  }

  async function buscarItens() {
    const { data } = await supabase
      .from('itens_pedido')
      .select('*, fornecedores(nome_fantasia, razao_social)')
      .eq('pedido_id', id)
      .range(0, 9999)
      .order('created_at')
    setItens(data || [])
  }

  async function buscarFornecedores() {
    const { data } = await supabase
      .from('fornecedores')
      .select('id, nome_fantasia, razao_social')
      .range(0, 9999)
      .order('nome_fantasia')
    setFornecedores(data || [])
  }

  async function buscarHistorico() {
    const { data } = await supabase
      .from('historico_alteracoes')
      .select('*')
      .eq('pedido_id', id)
      .range(0, 9999)
      .order('created_at', { ascending: false })
    setHistorico(data || [])
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
      requer_retirada_loja: item.requer_retirada_loja || false,
      requer_higienizacao: item.requer_higienizacao || false,
      requer_impermeabilizacao: item.requer_impermeabilizacao || false,
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
    setSalvandoItem(true)
    try {
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
      requer_retirada_loja: itemForm.requer_retirada_loja,
      requer_higienizacao: itemForm.requer_higienizacao,
      requer_impermeabilizacao: itemForm.requer_impermeabilizacao,
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
        if (itemForm.apto_entrega) setTimeout(() => verificarStatusPedido(), 500)
      }
      if (itemAnterior?.requer_icamento !== itemForm.requer_icamento) {
        mudancas.push(`Içamento: ${itemForm.requer_icamento ? 'Sim' : 'Não'}`)
      }
      if (itemAnterior?.requer_retirada_loja !== itemForm.requer_retirada_loja) {
        mudancas.push(`Retirada na loja: ${itemForm.requer_retirada_loja ? 'Sim' : 'Não'}`)
      }
      if (itemAnterior?.requer_higienizacao !== itemForm.requer_higienizacao) {
        mudancas.push(`Higienização: ${itemForm.requer_higienizacao ? 'Sim' : 'Não'}`)
      }
      if (itemAnterior?.requer_impermeabilizacao !== itemForm.requer_impermeabilizacao) {
        mudancas.push(`Impermeabilização: ${itemForm.requer_impermeabilizacao ? 'Sim' : 'Não'}`)
      }
      const descricao = `Item "${itemForm.descricao}" editado${mudancas.length ? ': ' + mudancas.join(' · ') : ''}`
      await registrarHistorico({ tipo: 'item_editado', descricao, pedidoId: id, itemId: editandoItemId || undefined })

      if (itemAnterior && itemAnterior.status !== itemForm.status) {
        const { data: { user } } = await supabase.auth.getUser()
        const { data: perfil } = await supabase.from('profiles').select('nome').eq('id', user?.id || '').single()
        await supabase.from('historico_itens').insert([{
          item_id: editandoItemId,
          pedido_id: id,
          status_anterior: itemAnterior.status,
          status_novo: itemForm.status,
          usuario_nome: perfil?.nome || user?.email || 'Usuário',
        }])
      }
    } else {
      const { error } = await supabase.from('itens_pedido').insert([{ ...payload, pedido_id: id, status: 'aguardando_compra' }])
      if (error) return alert('Erro: ' + error.message)
      await registrarHistorico({ tipo: 'item_adicionado', descricao: `Item "${itemForm.descricao}" adicionado ao pedido`, pedidoId: id })
    }

    setShowItemForm(false)
    setItemForm(itemFormVazio)
    setEditandoItemId(null)
    setItemAnterior(null)
    buscarItens()
    buscarHistorico()
    } finally {
      setSalvandoItem(false)
    }
  }

  const aptos = itens.filter(i => i.apto_entrega).length
  const icamento = itens.filter(i => i.requer_icamento).length

  const formItemSujo = showItemForm && !editandoItemId && [
    itemForm.descricao, itemForm.medida, itemForm.tecido, itemForm.cor,
    itemForm.acabamento, itemForm.observacoes, itemForm.fornecedor_id,
    itemForm.numero_nf, itemForm.data_recebimento, itemForm.previsao_chegada,
  ].some(v => v !== '') || (showItemForm && !editandoItemId && (itemForm.requer_icamento || itemForm.requer_tecido_fornecido))

  function fecharFormItem() {
    if (formItemSujo && !confirm('Tem certeza? Os dados preenchidos serão perdidos.')) return
    setShowItemForm(false)
    setItemForm(itemFormVazio)
  }

  function imprimirConferencia() {
    if (!pedido) return
    const now = new Date()
    const dataImpressao = now.toLocaleDateString('pt-BR') + ' · ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const totalPecas = itens.reduce((sum, i) => sum + (i.quantidade || 1), 0)
    const recebidos = itens.filter(i => i.status === 'recebido' || i.status === 'conferido_ok' || i.status === 'apto_entrega' || i.status === 'entregue').length
    const comIcamento = itens.filter(i => i.requer_icamento).length

    const STATUS_PRINT: Record<string, { label: string; bg: string; color: string }> = {
      aguardando_compra: { label: 'Aguard. compra', bg: '#FAECE7', color: '#712B13' },
      compra_enviada:    { label: 'Compra enviada', bg: '#FAEEDA', color: '#633806' },
      compra_confirmada: { label: 'Confirmado',     bg: '#FAEEDA', color: '#633806' },
      em_producao:       { label: 'Em produção',    bg: '#E6F1FB', color: '#0C447C' },
      em_transporte:     { label: 'Em transporte',  bg: '#FAEEDA', color: '#633806' },
      recebido:          { label: 'Recebido',        bg: '#EAF3DE', color: '#27500A' },
      conferido_ok:      { label: 'Conferido OK',   bg: '#EAF3DE', color: '#27500A' },
      conferido_com_problema: { label: 'Com problema', bg: '#FCEBEB', color: '#791F1F' },
      em_at:             { label: 'Em AT',           bg: '#EEEDFE', color: '#3C3489' },
      apto_entrega:      { label: 'Apto entrega',   bg: '#EAF3DE', color: '#27500A' },
      entregue:          { label: 'Entregue',        bg: '#EAF3DE', color: '#27500A' },
    }

    const linhasVazias = Math.max(0, 14 - itens.length)
    const linhasExtras = Array.from({ length: linhasVazias })

    const linhasHTML = itens.map(item => {
      const st = STATUS_PRINT[item.status] || { label: item.status, bg: '#f0efe9', color: '#555' }
      const forn = item.fornecedores?.nome_fantasia || item.fornecedores?.razao_social || '—'
      const detalhe = [item.medida, item.tecido, item.cor, item.acabamento].filter(Boolean).join(' · ')
      const qtd = String(item.quantidade || 1).padStart(2, '0')
      return `
        <tr>
          <td style="width:48px;text-align:center"><span style="display:inline-block;background:#1a1a2e;color:#C9A84C;font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px;min-width:28px;text-align:center">${qtd}</span></td>
          <td>
            <div style="font-size:12px;font-weight:500;color:#1a1a2e">${item.descricao}</div>
            ${detalhe ? `<div style="font-size:10px;color:#888;margin-top:2px">${detalhe}</div>` : ''}
          </td>
          <td style="width:80px;font-size:11px;color:#555">${forn}</td>
          <td style="width:80px"><span style="display:inline-block;padding:2px 7px;border-radius:4px;font-size:10px;font-weight:500;background:${st.bg};color:${st.color}">${st.label}</span></td>
          <td style="width:76px;text-align:center">${item.requer_icamento
            ? '<span style="display:inline-flex;align-items:center;gap:3px;background:#FCEBEB;color:#791F1F;font-size:10px;font-weight:500;padding:2px 7px;border-radius:4px">⚠ Sim</span>'
            : '<span style="display:inline-flex;align-items:center;background:#f0efe9;color:#888;font-size:10px;font-weight:500;padding:2px 7px;border-radius:4px">Não</span>'
          }</td>
          <td style="width:30px;text-align:center"><div style="width:16px;height:16px;border:1.5px solid #ccc;border-radius:3px;display:inline-block"></div></td>
        </tr>`
    }).join('')

    const vaziosHTML = linhasExtras.map(() => `
      <tr style="height:34px">
        <td></td><td></td><td></td><td></td><td></td>
        <td style="text-align:center"><div style="width:16px;height:16px;border:1.5px solid #ccc;border-radius:3px;display:inline-block"></div></td>
      </tr>`
    ).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Conferência — Pedido ${pedido.numero_pedido}</title>
    <style>
      @page { size: A4 portrait; margin: 12mm 14mm; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: sans-serif; color: #1a1a2e; background: white; }
      .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 2px solid #1a1a2e; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
      .info-block { background: #f7f6f3; border-radius: 7px; padding: 9px 13px; }
      .info-label { font-size: 8px; text-transform: uppercase; letter-spacing: 0.6px; color: #aaa; margin-bottom: 3px; font-weight: 500; }
      .info-value { font-size: 12px; font-weight: 500; color: #1a1a2e; }
      .info-sub { font-size: 11px; color: #555; }
      .section-title { font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; color: #888; margin-bottom: 7px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed; }
      thead tr { background: #1a1a2e; }
      thead th { color: #C9A84C; font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 7px 9px; text-align: left; }
      tbody tr { border-bottom: 0.5px solid #f0efe9; }
      tbody tr:nth-child(even) { background: #faf9f7; }
      tbody td { padding: 8px 9px; vertical-align: middle; }
      .obs-box { border: 0.5px solid #e8e7e3; border-radius: 6px; padding: 7px 11px; min-height: 36px; font-size: 11px; color: #888; font-style: italic; }
      .resumo { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; }
      .resumo-card { border-radius: 7px; padding: 9px 12px; text-align: center; }
      .resumo-label { font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; color: #aaa; margin-bottom: 3px; font-weight: 500; }
      .resumo-value { font-size: 18px; font-weight: 500; }
      .footer { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top: 16px; padding-top: 14px; border-top: 0.5px solid #e8e7e3; }
      .assinatura { border-top: 1px solid #bbb; padding-top: 5px; font-size: 9px; color: #aaa; text-align: center; margin-top: 28px; }
    </style></head><body>

    <div class="header">
      <img src="${LOGO_DARK}" alt="Opera House" style="height:48px;object-fit:contain">
      <div style="text-align:right">
        <div style="font-size:16px;font-weight:500">Pedido ${pedido.numero_pedido}</div>
        <div style="font-size:10px;color:#888;margin-top:2px">Impresso em ${dataImpressao}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-block">
        <div class="info-label">Cliente</div>
        <div class="info-value">${pedido.clientes?.nome || '—'}</div>
        <div class="info-sub">${[pedido.clientes?.cidade, pedido.clientes?.estado].filter(Boolean).join(' — ') || ''}</div>
      </div>
      <div class="info-block">
        <div class="info-label">Profissional responsável</div>
        <div class="info-value">${pedido.profissionais?.nome || '—'}</div>
        <div class="info-sub">${pedido.profissionais?.tipo || ''}</div>
      </div>
    </div>
    <div class="info-grid" style="margin-bottom:14px">
      <div class="info-block">
        <div class="info-label">Data da venda</div>
        <div class="info-value">${pedido.data_venda ? new Date(pedido.data_venda + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</div>
      </div>
      <div class="info-block">
        <div class="info-label">Prazo prometido</div>
        <div class="info-value">${pedido.prazo_prometido ? new Date(pedido.prazo_prometido + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</div>
      </div>
    </div>

    <div class="section-title">Itens do pedido</div>
    <table>
      <colgroup>
        <col style="width:48px">
        <col>
        <col style="width:80px">
        <col style="width:80px">
        <col style="width:76px">
        <col style="width:30px">
      </colgroup>
      <thead>
        <tr>
          <th>Qtd.</th>
          <th>Descrição do item</th>
          <th>Fornecedor</th>
          <th>Status</th>
          <th>Içamento</th>
          <th>✓</th>
        </tr>
      </thead>
      <tbody>${linhasHTML}${vaziosHTML}</tbody>
    </table>

    <div style="margin-top:14px;margin-bottom:14px">
      <div class="section-title">Observações gerais</div>
      <div class="obs-box">${pedido.observacoes_gerais || ''}</div>
    </div>

    <div class="resumo">
      <div class="resumo-card" style="background:#f7f6f3">
        <div class="resumo-label">Total de itens</div>
        <div class="resumo-value" style="color:#1a1a2e">${itens.length}</div>
      </div>
      <div class="resumo-card" style="background:#f7f6f3">
        <div class="resumo-label">Total de peças</div>
        <div class="resumo-value" style="color:#1a1a2e">${totalPecas}</div>
      </div>
      <div class="resumo-card" style="background:#FCEBEB">
        <div class="resumo-label" style="color:#A32D2D">Requer içamento</div>
        <div class="resumo-value" style="color:#791F1F">${comIcamento} ${comIcamento === 1 ? 'item' : 'itens'}</div>
      </div>
      <div class="resumo-card" style="background:#EAF3DE">
        <div class="resumo-label" style="color:#3B6D11">Recebidos</div>
        <div class="resumo-value" style="color:#27500A">${recebidos}</div>
      </div>
    </div>

    <div class="footer">
      <div><div class="assinatura">Conferido por</div></div>
      <div><div class="assinatura">Responsável expedição</div></div>
      <div><div class="assinatura">Motorista / entregador</div></div>
    </div>

    <script>window.onload = function() { window.print() }</script>
    </body></html>`

    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }
  }

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
              <span style={{ fontSize: '12px', color: '#888' }}>{SEMAFORO_LABEL[pedido.semaforo] || pedido.semaforo || '—'}</span>
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
                      <span style={{ fontSize: '13px', color: '#1a1a2e' }}>{SEMAFORO_LABEL[cor]}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <button onClick={imprimirConferencia} disabled={itens.length === 0}
            style={{ padding: '6px 14px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', color: '#555', fontSize: '12px', cursor: itens.length === 0 ? 'not-allowed' : 'pointer', opacity: itens.length === 0 ? 0.5 : 1 }}>
            Imprimir conferência
          </button>
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
                {pedido.data_entrega ? (
                  <>
                    <div style={{ fontSize: '11px', color: '#6a6a8a', marginBottom: '4px' }}>Data de entrega</div>
                    <div style={{ fontSize: '15px', fontWeight: '500', color: '#7BC67E' }}>
                      {new Date(pedido.data_entrega + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6a6a8a', marginTop: '4px' }}>
                      Prazo: {pedido.prazo_prometido ? new Date(pedido.prazo_prometido + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '11px', color: '#6a6a8a', marginBottom: '4px' }}>Prazo prometido</div>
                    <div style={{ fontSize: '15px', fontWeight: '500', color: '#C9A84C' }}>
                      {pedido.prazo_prometido ? new Date(pedido.prazo_prometido + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6a6a8a', marginTop: '4px' }}>
                      Venda: {pedido.data_venda ? new Date(pedido.data_venda + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                    </div>
                  </>
                )}
              </div>
            </div>
            {pedido.observacoes_gerais && (
              <div style={{ marginTop: '12px', padding: '10px 14px', background: '#252540', borderRadius: '8px', fontSize: '12px', color: '#8888aa' }}>
                {pedido.observacoes_gerais}
              </div>
            )}
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {!editandoDoc ? (
                <>
                  {pedido.numero_documento ? (
                    <div style={{ padding: '6px 12px', background: '#252540', borderRadius: '8px', fontSize: '12px', color: '#C9A84C', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#6a6a8a' }}>{pedido.tipo_documento || 'NF'}:</span>
                      <span style={{ fontWeight: '500' }}>{pedido.numero_documento}</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#4a4a6a' }}>Sem NF / Romaneio</span>
                  )}
                  <button onClick={() => { setDocForm({ tipo_documento: pedido.tipo_documento || 'NF', numero_documento: pedido.numero_documento || '' }); setEditandoDoc(true) }}
                    style={{ padding: '4px 10px', borderRadius: '6px', border: '0.5px solid #3a3a58', background: 'transparent', color: '#6a6a8a', fontSize: '11px', cursor: 'pointer' }}>
                    {pedido.numero_documento ? 'Editar' : '+ NF / Romaneio'}
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <select value={docForm.tipo_documento} onChange={e => setDocForm({ ...docForm, tipo_documento: e.target.value })}
                    style={{ padding: '5px 8px', borderRadius: '6px', border: '0.5px solid #3a3a58', background: '#252540', color: '#C9A84C', fontSize: '12px', outline: 'none' }}>
                    <option value="NF">NF</option>
                    <option value="Romaneio">Romaneio</option>
                    <option value="Outro">Outro</option>
                  </select>
                  <input value={docForm.numero_documento} onChange={e => setDocForm({ ...docForm, numero_documento: e.target.value })} placeholder="Número"
                    onKeyDown={e => { if (e.key === 'Enter') salvarDocumento(); if (e.key === 'Escape') setEditandoDoc(false) }}
                    style={{ padding: '5px 10px', borderRadius: '6px', border: '0.5px solid #C9A84C', background: '#252540', color: '#fff', fontSize: '12px', outline: 'none', width: '120px' }} autoFocus />
                  <button onClick={salvarDocumento} disabled={salvandoDoc}
                    style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', background: '#C9A84C', color: '#1a1a2e', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
                    {salvandoDoc ? '...' : 'Salvar'}
                  </button>
                  <button onClick={() => setEditandoDoc(false)}
                    style={{ padding: '5px 8px', borderRadius: '6px', border: '0.5px solid #3a3a58', background: 'transparent', color: '#888', fontSize: '12px', cursor: 'pointer' }}>
                    ✕
                  </button>
                </div>
              )}
            </div>
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

          <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', marginBottom: '12px', overflow: 'hidden' }}>
            <button onClick={() => setPagamentoAberto(a => !a)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: '600' }}>Pagamento</span>
                {!pagamentoAberto && !['pendente'].includes(pagamento.status_pagamento) && (
                  <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '5px', fontWeight: '500',
                    background: pagamento.status_pagamento === 'pago' ? '#EAF3DE' : pagamento.status_pagamento === 'pendente_boleto' ? '#FAEEDA' : '#FAEEDA',
                    color: pagamento.status_pagamento === 'pago' ? '#27500A' : '#633806' }}>
                    {pagamento.status_pagamento === 'pago' ? 'Pago' : pagamento.status_pagamento === 'pendente_boleto' ? 'Pend. Boleto' : 'Parcial'}
                  </span>
                )}
              </div>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round"
                style={{ transform: pagamentoAberto ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms' }}>
                <polyline points="2,4 6,8 10,4"/>
              </svg>
            </button>

            {pagamentoAberto && (
              <div style={{ padding: '0 16px 16px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10px', color: '#aaa', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Status</div>
                  <select value={pagamento.status_pagamento} onChange={e => setPagamento({ ...pagamento, status_pagamento: e.target.value })} onBlur={salvarPagamento}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '7px', border: '0.5px solid #e8e7e3', fontSize: '12px', outline: 'none', color: '#1a1a2e', background: '#fff' }}>
                    <option value="pendente">Pendente</option>
                    <option value="pendente_boleto">Pendente Boleto</option>
                    <option value="parcial">Parcial</option>
                    <option value="pago">Pago</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#aaa', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Observação</div>
                  <textarea
                    placeholder="Ex: sinal pago, restante na entrega..."
                    value={pagamento.observacao_pagamento}
                    onChange={e => setPagamento({ ...pagamento, observacao_pagamento: e.target.value })}
                    onBlur={salvarPagamento}
                    rows={3}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '7px', border: '0.5px solid #e8e7e3', fontSize: '12px', outline: 'none', boxSizing: 'border-box', resize: 'none', fontFamily: 'sans-serif' }}
                  />
                </div>
              </div>
            )}

            {pagamentoAberto && !['pendente'].includes(pagamento.status_pagamento) && (
              <div style={{ padding: '0 16px 12px' }}>
                <span style={{ fontSize: '11px', padding: '2px 9px', borderRadius: '6px', fontWeight: '500',
                  background: pagamento.status_pagamento === 'pago' ? '#EAF3DE' : '#FAEEDA',
                  color: pagamento.status_pagamento === 'pago' ? '#27500A' : '#633806' }}>
                  {pagamento.status_pagamento === 'pago' ? 'Pago' : pagamento.status_pagamento === 'pendente_boleto' ? 'Boleto pendente' : 'Parcialmente pago'}
                </span>
              </div>
            )}
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 110px 120px 90px 40px 36px 72px', padding: '8px 16px', background: '#f7f6f3', fontSize: '10px', fontWeight: '500', color: '#888', textTransform: 'uppercase', letterSpacing: '0.4px', gap: '8px' }}>
                  <span>Item</span><span>Qtd</span><span>Fornecedor</span><span>Status</span><span>Previsão</span><span>Apto</span><span></span><span></span>
                </div>
                {itens.map((item, i) => (
                  <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 50px 110px 120px 90px 40px 36px 72px', padding: '12px 16px', borderTop: '0.5px solid #f0efe9', alignItems: 'center', gap: '8px', background: item.tipo === 'tecido' ? '#F5F0FF' : item.tipo === 'outro' ? '#F5F5F5' : i % 2 === 0 ? '#fff' : '#faf9f7' }}>
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
                        {atItemIds.has(item.id) && (
                          <span style={{ marginLeft: '6px', background: '#FCEBEB', color: '#791F1F', padding: '1px 6px', borderRadius: '6px', fontSize: '10px' }}>AT ativa</span>
                        )}
                        {item.requer_retirada_loja && (
                          <span style={{ marginLeft: '6px', background: '#FFF3CD', color: '#7A5800', padding: '1px 6px', borderRadius: '6px', fontSize: '10px' }}>Retirada loja</span>
                        )}
                        {item.requer_higienizacao && (
                          <span style={{ marginLeft: '6px', background: '#E8F4FD', color: '#155E8A', padding: '1px 6px', borderRadius: '6px', fontSize: '10px' }}>Higienização</span>
                        )}
                        {item.requer_impermeabilizacao && (
                          <span style={{ marginLeft: '6px', background: '#E8F4FD', color: '#155E8A', padding: '1px 6px', borderRadius: '6px', fontSize: '10px' }}>Impermeab.</span>
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
                    <button onClick={() => verHistoricoItem(item.id)}
                      title="Ver histórico de status"
                      style={{ padding: '4px 8px', borderRadius: '5px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '11px', cursor: 'pointer', color: '#888' }}>
                      ↺
                    </button>
                    <button onClick={() => abrirEdicaoItem(item)} style={{ padding: '5px 12px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#555' }}>
                      Editar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>


          <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
            <button onClick={() => setHistoricoAberto(a => !a)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '500', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Histórico de alterações</span>
                {!historicoAberto && historico.length > 0 && (
                  <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '5px', fontWeight: '500', background: '#f0efe9', color: '#888' }}>
                    {historico.length} registros
                  </span>
                )}
              </div>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round"
                style={{ transform: historicoAberto ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms' }}>
                <polyline points="2,4 6,8 10,4"/>
              </svg>
            </button>

            {historicoAberto && (
              historico.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>Nenhuma alteração registrada ainda.</div>
              ) : (
                <div style={{ padding: '8px 0', borderTop: '0.5px solid #f0efe9' }}>
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
              )
            )}
          </div>

        </div>
      </div>

      {showItemForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '520px', maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a2e' }}>{editandoItemId ? 'Editar item' : 'Adicionar item ao pedido'}</span>
              <button onClick={fecharFormItem} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>✕</button>
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

            <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="retirada_loja" checked={itemForm.requer_retirada_loja} onChange={e => setItemForm({ ...itemForm, requer_retirada_loja: e.target.checked })} />
              <label htmlFor="retirada_loja" style={{ fontSize: '13px', color: '#555', cursor: 'pointer' }}>Requer retirada na loja</label>
            </div>

            <div style={{ marginBottom: '4px' }}>
              <div style={{ fontSize: '10px', color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '500' }}>Tratamentos especiais</div>
              <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="higienizacao" checked={itemForm.requer_higienizacao} onChange={e => setItemForm({ ...itemForm, requer_higienizacao: e.target.checked })} />
                <label htmlFor="higienizacao" style={{ fontSize: '13px', color: '#555', cursor: 'pointer' }}>Requer higienização</label>
              </div>
              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="impermeabilizacao" checked={itemForm.requer_impermeabilizacao} onChange={e => setItemForm({ ...itemForm, requer_impermeabilizacao: e.target.checked })} />
                <label htmlFor="impermeabilizacao" style={{ fontSize: '13px', color: '#555', cursor: 'pointer' }}>Requer impermeabilização</label>
              </div>
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
              <button onClick={fecharFormItem} style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
              <button onClick={salvarItem} disabled={salvandoItem} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#1a1a2e', color: '#C9A84C', fontSize: '13px', fontWeight: '500', cursor: salvandoItem ? 'not-allowed' : 'pointer', opacity: salvandoItem ? 0.7 : 1 }}>
                {salvandoItem ? 'Salvando...' : (editandoItemId ? 'Salvar alterações' : 'Salvar item')}
              </button>
            </div>
          </div>
        </div>
      )}

      {historicoItemId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '440px', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a2e' }}>Histórico de status</span>
              <button onClick={() => setHistoricoItemId(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>
            {historicoItens.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#888', fontSize: '13px', padding: '24px 0' }}>Nenhuma alteração de status registrada.</div>
            ) : (
              historicoItens.map((h, i) => (
                <div key={h.id} style={{ display: 'flex', gap: '12px', paddingBottom: '12px', marginBottom: '12px', borderBottom: i < historicoItens.length - 1 ? '0.5px solid #f0efe9' : 'none' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C9A84C', flexShrink: 0, marginTop: '5px' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#1a1a2e', marginBottom: '2px' }}>
                      <span style={{ color: '#888' }}>{h.status_anterior || '—'}</span>
                      {' → '}
                      <span style={{ fontWeight: '500' }}>{h.status_novo}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#aaa' }}>
                      {h.usuario_nome} · {new Date(h.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
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
