'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

interface Acao {
  id: string
  href: string
  tipo: 'urgente' | 'atencao' | 'info'
  titulo: string
  detalhe: string
  tag: string
  tagColor: string
  tagBg: string
}

interface EventoDia {
  tipo: 'entrega' | 'at'
  label: string
}

interface Lembrete {
  id: string
  texto: string
  feito: boolean
  urgente: boolean
}

const TIPO_STYLE = {
  urgente: { border: '#A32D2D', dot: '#A32D2D' },
  atencao: { border: '#BA7517', dot: '#BA7517' },
  info:    { border: '#185FA5', dot: '#185FA5' },
}

const DIAS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const CHAVE_LEMBRETES = 'operare_lembretes'

function lerLembretes(): Lembrete[] {
  try {
    const raw = localStorage.getItem(CHAVE_LEMBRETES)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function salvarLembretes(lista: Lembrete[]) {
  localStorage.setItem(CHAVE_LEMBRETES, JSON.stringify(lista))
}

export default function Dashboard() {
  const [usuario, setUsuario] = useState<{ nome: string; cargo: string } | null>(null)
  const [acoes, setAcoes] = useState<Acao[]>([])
  const [dados, setDados] = useState({ pedidosAndamento: 0, pedidosAtrasados: 0, aptoEntrega: 0, atsAbertas: 0, entregasAmanha: 0, entreguesMes: 0 })
  const [showSino, setShowSino] = useState(false)
  const [showAvatar, setShowAvatar] = useState(false)
  const [eventosPorDia, setEventosPorDia] = useState<Record<string, EventoDia[]>>({})
  const [lembretes, setLembretes] = useState<Lembrete[]>([])
  const [novoTexto, setNovoTexto] = useState('')
  const [novoUrgente, setNovoUrgente] = useState(false)
  const [diasSemana, setDiasSemana] = useState<{ data: string; diaSemana: string; diaNum: number; hoje: boolean }[]>([])
  const [periodoCalendario, setPeriodoCalendario] = useState(7)
  const [loading, setLoading] = useState(true)

  function gerarDias(total: number) {
    const hoje = new Date()
    return Array.from({ length: total }, (_, i) => {
      const d = new Date(hoje)
      d.setDate(d.getDate() + i)
      return {
        data: d.toISOString().split('T')[0],
        diaSemana: DIAS_PT[d.getDay()],
        diaNum: d.getDate(),
        hoje: i === 0,
      }
    })
  }

  useEffect(() => {
    buscarUsuario()
    buscar()
    setLembretes(lerLembretes())
    setDiasSemana(gerarDias(7))
  }, [])

  useEffect(() => {
    setDiasSemana(gerarDias(periodoCalendario))
  }, [periodoCalendario])


  async function buscarUsuario() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('nome, cargo').eq('id', user.id).single()
    if (data) setUsuario(data as { nome: string; cargo: string })
  }

  async function buscar() {
    setLoading(true)
    const hoje = new Date()
    const hojeStr = hoje.toISOString().split('T')[0]
    const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1)
    const amanhaStr = amanha.toISOString().split('T')[0]
    const horizonte = new Date(hoje); horizonte.setDate(horizonte.getDate() + 21)
    const horizonteStr = horizonte.toISOString().split('T')[0]
    const seteDiasAtras = new Date(hoje); seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]

    const resultados = await Promise.all([
      supabase.from('pedidos').select('id, numero_pedido, prazo_prometido, semaforo, clientes(nome, cidade)').not('status', 'in', '(entregue,cancelado)').range(0, 9999),
      supabase.from('itens_pedido').select('id, apto_entrega, pedido_id, status').range(0, 9999),
      supabase.from('assistencias_tecnicas').select('id, status, updated_at, pedidos(numero_pedido)').in('status', ['aberta', 'aguardando_retirada', 'em_reparo', 'enviado_fornecedor', 'aguardando_devolucao']).range(0, 9999),
      supabase.from('entregas').select('id, pedidos(numero_pedido, clientes(nome))').eq('data_agendada', amanhaStr).range(0, 9999),
      supabase.from('pedidos').select('id').eq('status', 'entregue').gte('updated_at', inicioMes).range(0, 9999),
      supabase.from('ocorrencias').select('id, created_at, pedidos(numero_pedido, clientes(nome))').eq('status', 'aberta').lt('created_at', new Date(hoje.getTime() - 3 * 86400000).toISOString()).range(0, 9999),
      supabase.from('itens_pedido').select('id, descricao, pedido_id, pedidos(numero_pedido, clientes(nome))').eq('requer_tecido_fornecido', true).not('apto_entrega', 'is', true).not('status', 'in', '(entregue,cancelado)').range(0, 9999),
      supabase.from('itens_pedido').select('id, descricao, pedido_id, pedidos(numero_pedido, clientes(nome))').is('previsao_chegada', null).not('status', 'in', '(entregue,apto_entrega,conferido_ok,recebido)').range(0, 9999),
      supabase.from('itens_pedido').select('id, descricao, pedido_id, pedidos(numero_pedido, clientes(nome))').eq('requer_higienizacao', true).not('apto_entrega', 'is', true).not('status', 'in', '(entregue,cancelado)').range(0, 9999),
      supabase.from('itens_pedido').select('id, descricao, pedido_id, pedidos(numero_pedido, clientes(nome))').eq('requer_impermeabilizacao', true).not('apto_entrega', 'is', true).not('status', 'in', '(entregue,cancelado)').range(0, 9999),
      supabase.from('entregas').select('data_agendada, pedidos(numero_pedido)').gte('data_agendada', hojeStr).lte('data_agendada', horizonteStr).range(0, 9999),
      supabase.from('assistencias_tecnicas').select('data_retirada_agendada, pedidos(numero_pedido)').not('data_retirada_agendada', 'is', null).gte('data_retirada_agendada', hojeStr).lte('data_retirada_agendada', horizonteStr).range(0, 9999),
    ])

    const nomes = ['pedidos', 'itens', 'ats', 'entregas', 'entreguesMes', 'ocorrencias', 'itensTecido', 'itensSemPrevisao', 'itensHigienizacao', 'itensImperm', 'entregasCalendario', 'atsCalendario']
    resultados.forEach((r, i) => { if (r.error) console.error(`Erro na query do dashboard (${nomes[i]}):`, r.error) })

    const [
      { data: pedidos }, { data: itens }, { data: ats }, { data: entregas },
      { data: entreguesMes }, { data: ocorrencias }, { data: itensTecido },
      { data: itensSemPrevisao }, { data: itensHigienizacao }, { data: itensImperm },
      { data: entregasCalendario }, { data: atsCalendario },
    ] = resultados

    const pedidosAtivos = (pedidos || []) as any[]
    const itensData = (itens || []) as any[]
    const atsData = (ats || []) as any[]
    const entregasData = (entregas || []) as any[]
    const ocorrenciasData = (ocorrencias || []) as any[]
    const itensTecidoData = (itensTecido || []) as any[]
    const itensSemPrevisaoData = (itensSemPrevisao || []) as any[]

    const aptoIds = new Set(itensData.filter(i => i.apto_entrega).map(i => i.pedido_id))
    const atsSemUpdate = atsData.filter(a => !a.updated_at || new Date(a.updated_at) < seteDiasAtras)
    const atrasados = pedidosAtivos.filter(p => p.prazo_prometido && p.prazo_prometido < hojeStr)

    const lista: Acao[] = []

    atrasados.forEach((p: any) => {
      const diasAtraso = Math.floor((new Date(hojeStr).getTime() - new Date(p.prazo_prometido).getTime()) / 86400000)
      lista.push({
        id: p.id, href: `/pedidos/${p.id}`, tipo: 'urgente',
        titulo: `Pedido ${p.numero_pedido} · ${(p.clientes as any)?.nome || ''}`,
        detalhe: `Prazo vencido há ${diasAtraso} dia${diasAtraso !== 1 ? 's' : ''} · ${(p.clientes as any)?.cidade || ''}`,
        tag: 'Atrasado', tagColor: '#791F1F', tagBg: '#FCEBEB',
      })
    })

    atsSemUpdate.forEach((a: any) => {
      const diasSemUpdate = Math.floor((hoje.getTime() - new Date(a.updated_at || a.created_at || hojeStr).getTime()) / 86400000)
      lista.push({
        id: a.id, href: '/assistencia', tipo: 'atencao',
        titulo: `AT do pedido ${(a.pedidos as any)?.numero_pedido || '—'}`,
        detalhe: `Sem atualização há ${diasSemUpdate} dia${diasSemUpdate !== 1 ? 's' : ''}`,
        tag: 'Sem atualização', tagColor: '#633806', tagBg: '#FAEEDA',
      })
    })

    pedidosAtivos.filter((p: any) => aptoIds.has(p.id) && !atrasados.find((a: any) => a.id === p.id)).forEach((p: any) => {
      lista.push({
        id: p.id, href: `/pedidos/${p.id}`, tipo: 'atencao',
        titulo: `Pedido ${p.numero_pedido} · ${(p.clientes as any)?.nome || ''}`,
        detalhe: 'Itens prontos — aguardando agendamento de entrega',
        tag: 'Apto p/ agendar', tagColor: '#27500A', tagBg: '#EAF3DE',
      })
    })

    entregasData.forEach((e: any) => {
      lista.push({
        id: e.id, href: '/entregas', tipo: 'info',
        titulo: `Entrega amanhã · Pedido ${(e.pedidos as any)?.numero_pedido || '—'}`,
        detalhe: `Cliente: ${(e.pedidos as any)?.clientes?.nome || '—'}`,
        tag: 'Amanhã', tagColor: '#0C447C', tagBg: '#E6F1FB',
      })
    })

    ocorrenciasData.forEach((o: any) => {
      const diasAberta = Math.floor((hoje.getTime() - new Date(o.created_at).getTime()) / 86400000)
      lista.push({
        id: o.id, href: '/ocorrencias', tipo: 'atencao',
        titulo: `Ocorrência · Pedido ${(o.pedidos as any)?.numero_pedido || '—'}`,
        detalhe: `Aberta há ${diasAberta} dia${diasAberta !== 1 ? 's' : ''} sem resolução · ${(o.pedidos as any)?.clientes?.nome || ''}`,
        tag: 'Ocorrência aberta', tagColor: '#633806', tagBg: '#FAEEDA',
      })
    })

    const pedidosTecidoVistos = new Set<string>()
    itensTecidoData.forEach((i: any) => {
      if (pedidosTecidoVistos.has(i.pedido_id)) return
      pedidosTecidoVistos.add(i.pedido_id)
      lista.push({
        id: i.id, href: `/pedidos/${i.pedido_id}`, tipo: 'atencao',
        titulo: `Pedido ${(i.pedidos as any)?.numero_pedido || '—'} · ${(i.pedidos as any)?.clientes?.nome || ''}`,
        detalhe: `Item "${i.descricao}" aguarda envio de tecido fornecido ao fornecedor`,
        tag: 'Tecido pendente', tagColor: '#3C3489', tagBg: '#EEEDFE',
      })
    })

    const pedidosSemPrevisaoVistos = new Set<string>()
    itensSemPrevisaoData.forEach((i: any) => {
      if (pedidosSemPrevisaoVistos.has(i.pedido_id)) return
      pedidosSemPrevisaoVistos.add(i.pedido_id)
      lista.push({
        id: i.id, href: `/pedidos/${i.pedido_id}`, tipo: 'info',
        titulo: `Pedido ${(i.pedidos as any)?.numero_pedido || '—'} · ${(i.pedidos as any)?.clientes?.nome || ''}`,
        detalhe: `Item "${i.descricao}" sem previsão de chegada definida`,
        tag: 'Sem previsão', tagColor: '#0C447C', tagBg: '#E6F1FB',
      })
    })

    const pedidosHigienizacaoVistos = new Set<string>()
    ;(itensHigienizacao || []).forEach((i: any) => {
      if (pedidosHigienizacaoVistos.has(i.pedido_id)) return
      pedidosHigienizacaoVistos.add(i.pedido_id)
      lista.push({
        id: i.id, href: `/pedidos/${i.pedido_id}`, tipo: 'atencao',
        titulo: `Pedido ${(i.pedidos as any)?.numero_pedido || '—'} · ${(i.pedidos as any)?.clientes?.nome || ''}`,
        detalhe: `Item "${i.descricao}" requer higienização antes da entrega`,
        tag: 'Higienização', tagColor: '#155E8A', tagBg: '#E8F4FD',
      })
    })

    const pedidosImpermVistos = new Set<string>()
    ;(itensImperm || []).forEach((i: any) => {
      if (pedidosImpermVistos.has(i.pedido_id)) return
      pedidosImpermVistos.add(i.pedido_id)
      lista.push({
        id: i.id, href: `/pedidos/${i.pedido_id}`, tipo: 'atencao',
        titulo: `Pedido ${(i.pedidos as any)?.numero_pedido || '—'} · ${(i.pedidos as any)?.clientes?.nome || ''}`,
        detalhe: `Item "${i.descricao}" requer impermeabilização antes da entrega`,
        tag: 'Impermeabilização', tagColor: '#155E8A', tagBg: '#E8F4FD',
      })
    })

    // Montar calendário 7 dias
    const epd: Record<string, EventoDia[]> = {}
    ;(entregasCalendario || []).forEach((e: any) => {
      const d = e.data_agendada
      if (!epd[d]) epd[d] = []
      epd[d].push({ tipo: 'entrega', label: `Ped. ${(e.pedidos as any)?.numero_pedido || '—'}` })
    })
    ;(atsCalendario || []).forEach((a: any) => {
      const d = a.data_retirada_agendada
      if (!d) return
      if (!epd[d]) epd[d] = []
      epd[d].push({ tipo: 'at', label: `AT ${(a.pedidos as any)?.numero_pedido || '—'}` })
    })
    setEventosPorDia(epd)

    setAcoes(lista)
    setDados({
      pedidosAndamento: pedidosAtivos.length,
      pedidosAtrasados: atrasados.length,
      aptoEntrega: aptoIds.size,
      atsAbertas: atsData.length,
      entregasAmanha: entregasData.length,
      entreguesMes: (entreguesMes || []).length,
    })
    setLoading(false)
  }

  function adicionarLembrete() {
    const texto = novoTexto.trim()
    if (!texto) return
    const novo: Lembrete = { id: Date.now().toString(), texto, feito: false, urgente: novoUrgente }
    const atualizado = [...lembretes, novo]
    setLembretes(atualizado)
    salvarLembretes(atualizado)
    setNovoTexto('')
    setNovoUrgente(false)
  }

  function toggleFeito(id: string) {
    const atualizado = lembretes.map(l => l.id === id ? { ...l, feito: !l.feito } : l)
    setLembretes(atualizado)
    salvarLembretes(atualizado)
  }

  function excluirLembrete(id: string) {
    const atualizado = lembretes.filter(l => l.id !== id)
    setLembretes(atualizado)
    salvarLembretes(atualizado)
  }

  const primeiroNome = usuario?.nome?.split(' ')[0] || '...'
  const inicial = usuario?.nome?.charAt(0).toUpperCase() || '?'
  const dataHoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#f7f6f3' }}>
      <Sidebar ativa="/dashboard" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        <div style={{ height: '52px', background: '#fff', borderBottom: '0.5px solid #e8e7e3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', flexShrink: 0, position: 'relative', zIndex: 50 }}>
          <span style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a2e' }}>Dashboard operacional</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

            {/* Sino */}
            <div style={{ position: 'relative' }}>
              <div onClick={() => { setShowSino(!showSino); setShowAvatar(false) }}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', color: '#888', userSelect: 'none' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 1.5a5 5 0 0 1 5 5v3l1 1.5H2L3 9.5v-3a5 5 0 0 1 5-5z"/>
                  <path d="M6.5 13.5a1.5 1.5 0 0 0 3 0"/>
                </svg>
              </div>
              {acoes.length > 0 && (
                <div style={{ position: 'absolute', top: '2px', right: '2px', width: '14px', height: '14px', borderRadius: '50%', background: '#A32D2D', color: '#fff', fontSize: '8px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  {acoes.length > 9 ? '9+' : acoes.length}
                </div>
              )}
              {showSino && (
                <>
                  <div onClick={() => setShowSino(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                  <div style={{ position: 'absolute', top: '40px', right: 0, width: '380px', background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 50, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #f0efe9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a2e' }}>Alertas</span>
                      <span style={{ fontSize: '11px', color: '#888' }}>{acoes.length} pendente{acoes.length !== 1 ? 's' : ''}</span>
                    </div>
                    {acoes.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Nenhum alerta no momento.</div>
                    ) : (
                      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {acoes.map((acao, i) => (
                          <a key={`sino-${acao.id}-${i}`} href={acao.href} onClick={() => setShowSino(false)}
                            style={{ display: 'flex', gap: '10px', padding: '12px 16px', borderTop: i > 0 ? '0.5px solid #f0efe9' : 'none', textDecoration: 'none', alignItems: 'flex-start', borderLeft: `3px solid ${TIPO_STYLE[acao.tipo].border}` }}>
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: TIPO_STYLE[acao.tipo].dot, flexShrink: 0, marginTop: '5px' }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '12px', fontWeight: '500', color: '#1a1a2e', marginBottom: '2px' }}>{acao.titulo}</div>
                              <div style={{ fontSize: '11px', color: '#888' }}>{acao.detalhe}</div>
                            </div>
                            <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '5px', fontWeight: '500', background: acao.tagBg, color: acao.tagColor, whiteSpace: 'nowrap', flexShrink: 0 }}>
                              {acao.tag}
                            </span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Avatar */}
            <div style={{ position: 'relative' }}>
              <div onClick={() => { setShowAvatar(!showAvatar); setShowSino(false) }}
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#C9A84C', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}>
                {inicial}
              </div>
              {showAvatar && (
                <>
                  <div onClick={() => setShowAvatar(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                  <div style={{ position: 'absolute', top: '40px', right: 0, width: '220px', background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 50, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #f0efe9' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a2e' }}>{usuario?.nome}</div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{usuario?.cargo || 'Usuário'}</div>
                    </div>
                    <a href="/usuarios" onClick={() => setShowAvatar(false)} style={{ display: 'block', padding: '11px 16px', fontSize: '13px', color: '#555', textDecoration: 'none', borderBottom: '0.5px solid #f0efe9' }}>Gerenciar usuários</a>
                    <a href="/configuracoes" onClick={() => setShowAvatar(false)} style={{ display: 'block', padding: '11px 16px', fontSize: '13px', color: '#555', textDecoration: 'none', borderBottom: '0.5px solid #f0efe9' }}>Configurações</a>
                    <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
                      style={{ display: 'block', width: '100%', padding: '11px 16px', fontSize: '13px', color: '#A32D2D', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Sair
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px', color: '#aaa', fontSize: '13px', gap: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round">
                <path d="M8 1v3M8 12v3M1 8h3M12 8h3M3.1 3.1l2.1 2.1M10.8 10.8l2.1 2.1M3.1 12.9l2.1-2.1M10.8 5.2l2.1-2.1"/>
              </svg>
              Carregando...
            </div>
          )}

          {/* Cards topo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
            {[
              { label: 'Em andamento', value: dados.pedidosAndamento, color: '#1a1a2e' },
              { label: 'Atrasados', value: dados.pedidosAtrasados, color: '#A32D2D' },
              { label: 'Apto p/ agendar', value: dados.aptoEntrega, color: '#3B6D11' },
              { label: 'ATs abertas', value: dados.atsAbertas, color: '#185FA5' },
            ].map(card => (
              <div key={card.label} style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', padding: '16px 18px' }}>
                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '8px' }}>{card.label}</div>
                <div style={{ fontSize: '28px', fontWeight: '600', color: card.color, lineHeight: 1 }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Calendário full-width */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #f0efe9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Calendário</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[7, 14, 21].map(p => (
                    <button key={p} onClick={() => setPeriodoCalendario(p)} style={{
                      padding: '3px 10px', borderRadius: '6px', border: '0.5px solid',
                      borderColor: periodoCalendario === p ? '#1a1a2e' : '#e0deda',
                      background: periodoCalendario === p ? '#1a1a2e' : '#fff',
                      color: periodoCalendario === p ? '#C9A84C' : '#888',
                      fontSize: '11px', fontWeight: '500', cursor: 'pointer',
                    }}>{p} dias</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '2px', background: '#3B6D11' }} />
                  <span style={{ fontSize: '10px', color: '#888' }}>Entrega</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '2px', background: '#185FA5' }} />
                  <span style={{ fontSize: '10px', color: '#888' }}>Retirada AT</span>
                </div>
              </div>
            </div>
            <div style={{ padding: '10px', display: 'grid', gridTemplateColumns: `repeat(${periodoCalendario}, 1fr)`, gap: '4px' }}>
              {diasSemana.map(dia => {
                const eventos = eventosPorDia[dia.data] || []
                return (
                  <div key={dia.data} style={{
                    borderRadius: '7px',
                    border: dia.hoje ? '1px solid #C9A84C' : '0.5px solid #f0efe9',
                    background: dia.hoje ? '#fffbf0' : '#fafaf8',
                    padding: periodoCalendario === 21 ? '4px 3px' : '6px 4px',
                    minHeight: periodoCalendario === 21 ? '60px' : '80px',
                  }}>
                    <div style={{ fontSize: periodoCalendario === 21 ? '8px' : '9px', color: dia.hoje ? '#C9A84C' : '#aaa', textAlign: 'center', marginBottom: '1px', fontWeight: dia.hoje ? '600' : '400' }}>{dia.diaSemana}</div>
                    <div style={{ fontSize: periodoCalendario === 21 ? '11px' : '13px', fontWeight: '600', color: dia.hoje ? '#C9A84C' : '#1a1a2e', textAlign: 'center', marginBottom: '4px' }}>{dia.diaNum}</div>
                    {eventos.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#e0deda', fontSize: '10px' }}>—</div>
                    ) : (
                      eventos.map((ev, ei) => (
                        <div key={ei} style={{
                          fontSize: '8px', padding: '2px 3px', borderRadius: '3px', marginBottom: '2px',
                          background: ev.tipo === 'entrega' ? '#EAF3DE' : '#E6F1FB',
                          color: ev.tipo === 'entrega' ? '#27500A' : '#0C447C',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          lineHeight: '1.4',
                        }}>{ev.label}</div>
                      ))
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 380px', gap: '16px' }}>

            {/* Inbox ações */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden', alignSelf: 'start' }}>
              <div style={{ padding: '14px 20px', borderBottom: '0.5px solid #f0efe9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a2e' }}>Olá, {primeiroNome}</span>
                  <span style={{ fontSize: '13px', color: '#888', marginLeft: '8px' }}>
                    {acoes.length === 0 ? '— tudo em ordem.' : `— ${acoes.length} item${acoes.length !== 1 ? 'ns' : ''} precisando de atenção.`}
                  </span>
                </div>
                {acoes.length > 0 && (
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#A32D2D', color: '#fff', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {acoes.length}
                  </div>
                )}
              </div>
              {acoes.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a2e', marginBottom: '4px' }}>Nada pendente</div>
                  <div style={{ fontSize: '13px', color: '#888' }}>Todos os pedidos estão dentro do prazo.</div>
                </div>
              ) : (
                acoes.map((acao, i) => (
                  <a key={`${acao.id}-${i}`} href={acao.href}
                    style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '13px 20px', borderTop: '0.5px solid #f0efe9', textDecoration: 'none', borderLeft: `3px solid ${TIPO_STYLE[acao.tipo].border}` }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: TIPO_STYLE[acao.tipo].dot, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acao.titulo}</div>
                      <div style={{ fontSize: '12px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acao.detalhe}</div>
                    </div>
                    <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '6px', fontWeight: '500', background: acao.tagBg, color: acao.tagColor, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {acao.tag}
                    </span>
                    <span style={{ fontSize: '14px', color: '#ccc', flexShrink: 0 }}>→</span>
                  </a>
                ))
              )}
            </div>

            {/* Coluna direita */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Lembretes do dia */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #f0efe9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lembretes do dia</span>
                  <span style={{ fontSize: '11px', color: '#aaa' }}>{dataHoje}</span>
                </div>

                {lembretes.length === 0 ? (
                  <div style={{ padding: '20px 16px', textAlign: 'center', color: '#bbb', fontSize: '12px' }}>
                    Nenhum lembrete para hoje.
                  </div>
                ) : (
                  <div>
                    {lembretes.map(l => (
                      <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 16px', borderBottom: '0.5px solid #f9f8f5' }}>
                        <button onClick={() => toggleFeito(l.id)} style={{
                          width: '17px', height: '17px', borderRadius: '5px', flexShrink: 0, cursor: 'pointer',
                          border: l.feito ? 'none' : '1.5px solid #d0cfcb',
                          background: l.feito ? '#C9A84C' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                        }}>
                          {l.feito && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><polyline points="2,5 4,7 8,3"/></svg>
                          )}
                        </button>
                        <span style={{ flex: 1, fontSize: '12px', color: l.feito ? '#bbb' : '#1a1a2e', textDecoration: l.feito ? 'line-through' : 'none', lineHeight: '1.4' }}>{l.texto}</span>
                        {l.urgente && !l.feito && (
                          <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '4px', background: '#FCEBEB', color: '#791F1F', fontWeight: '500', flexShrink: 0 }}>urgente</span>
                        )}
                        <button onClick={() => excluirLembrete(l.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', fontSize: '14px', padding: '0 2px', lineHeight: 1, flexShrink: 0 }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#A32D2D' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#ddd' }}>×</button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ padding: '10px 12px', borderTop: '0.5px solid #f0efe9', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    placeholder="Adicionar lembrete..."
                    value={novoTexto}
                    onChange={e => setNovoTexto(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') adicionarLembrete() }}
                    style={{ flex: 1, fontSize: '12px', padding: '6px 10px', border: '0.5px solid #e0deda', borderRadius: '7px', outline: 'none', color: '#444', background: '#fafaf8' }}
                  />
                  <button onClick={() => setNovoUrgente(!novoUrgente)}
                    title="Marcar como urgente"
                    style={{
                      padding: '6px 8px', borderRadius: '7px', border: '0.5px solid',
                      borderColor: novoUrgente ? '#A32D2D' : '#e0deda',
                      background: novoUrgente ? '#FCEBEB' : '#fafaf8',
                      cursor: 'pointer', fontSize: '11px',
                      color: novoUrgente ? '#791F1F' : '#aaa',
                      fontWeight: '500', flexShrink: 0,
                    }}>!</button>
                  <button onClick={adicionarLembrete}
                    style={{ padding: '6px 12px', borderRadius: '7px', border: 'none', background: '#1a1a2e', color: '#C9A84C', fontSize: '12px', cursor: 'pointer', flexShrink: 0, fontWeight: '500' }}>
                    Salvar
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
