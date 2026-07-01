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

interface DonutSegment {
  label: string
  value: number
  color: string
}

function DonutChart({ segments, total }: { segments: DonutSegment[]; total: number }) {
  const r = 54
  const circ = 2 * Math.PI * r
  let offset = 0
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      {segments.map((seg, i) => {
        const pct = total > 0 ? seg.value / total : 0
        const dash = pct * circ - 2
        const o = offset
        offset += pct * circ
        return (
          <circle key={i} cx="70" cy="70" r={r} fill="none" stroke={seg.color} strokeWidth="16"
            strokeDasharray={`${Math.max(0, dash)} ${circ}`}
            strokeDashoffset={-o + circ * 0.25} strokeLinecap="butt" />
        )
      })}
      <text x="70" y="66" textAnchor="middle" fontSize="22" fontWeight="600" fill="#1a1a2e">{total}</text>
      <text x="70" y="82" textAnchor="middle" fontSize="10" fill="#888">pedidos</text>
    </svg>
  )
}

const TIPO_STYLE = {
  urgente: { border: '#A32D2D', dot: '#A32D2D' },
  atencao: { border: '#BA7517', dot: '#BA7517' },
  info:    { border: '#185FA5', dot: '#185FA5' },
}

export default function Dashboard() {
  const [usuario, setUsuario] = useState<{ nome: string } | null>(null)
  const [acoes, setAcoes] = useState<Acao[]>([])
  const [dados, setDados] = useState({ pedidosAndamento: 0, pedidosAtrasados: 0, aptoEntrega: 0, atsAbertas: 0, entregasAmanha: 0, entreguesMes: 0 })
  const [statusDist, setStatusDist] = useState<DonutSegment[]>([])

  useEffect(() => {
    buscarUsuario()
    buscar()
  }, [])

  async function buscarUsuario() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('nome').eq('id', user.id).single()
    if (data) setUsuario(data)
  }

  async function buscar() {
    const hoje = new Date()
    const hojeStr = hoje.toISOString().split('T')[0]
    const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1)
    const amanhaStr = amanha.toISOString().split('T')[0]
    const seteDiasAtras = new Date(hoje); seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]

    const [
      { data: pedidos },
      { data: itens },
      { data: ats },
      { data: entregas },
      { data: entreguesMes },
    ] = await Promise.all([
      supabase.from('pedidos').select('id, numero_pedido, prazo_prometido, semaforo, clientes(nome, cidade)').not('status', 'in', '(entregue,cancelado)'),
      supabase.from('itens_pedido').select('id, apto_entrega, pedido_id, tem_at, status'),
      supabase.from('assistencias_tecnicas').select('id, status, updated_at, pedidos(numero_pedido)').in('status', ['aberta', 'aguardando_retirada', 'em_reparo', 'enviado_fornecedor', 'aguardando_devolucao']),
      supabase.from('entregas').select('id, pedidos(numero_pedido, clientes(nome))').eq('data_agendada', amanhaStr),
      supabase.from('pedidos').select('id').eq('status', 'entregue').gte('updated_at', inicioMes),
    ])

    const pedidosAtivos = (pedidos || []) as any[]
    const itensData = (itens || []) as any[]
    const atsData = (ats || []) as any[]
    const entregasData = (entregas || []) as any[]

    const aptoIds = new Set(itensData.filter(i => i.apto_entrega).map(i => i.pedido_id))
    const comAtIds = new Set(itensData.filter(i => i.tem_at).map(i => i.pedido_id))
    const atsSemUpdate = atsData.filter(a => !a.updated_at || new Date(a.updated_at) < seteDiasAtras)
    const atrasados = pedidosAtivos.filter(p => p.prazo_prometido && p.prazo_prometido < hojeStr)

    // Montar lista de ações
    const lista: Acao[] = []

    atrasados.forEach((p: any) => {
      const diasAtraso = Math.floor((new Date(hojeStr).getTime() - new Date(p.prazo_prometido).getTime()) / 86400000)
      lista.push({
        id: p.id, href: `/pedidos/${p.id}`,
        tipo: 'urgente',
        titulo: `Pedido ${p.numero_pedido} · ${(p.clientes as any)?.nome || ''}`,
        detalhe: `Prazo vencido há ${diasAtraso} dia${diasAtraso !== 1 ? 's' : ''} · ${(p.clientes as any)?.cidade || ''}`,
        tag: 'Atrasado', tagColor: '#791F1F', tagBg: '#FCEBEB',
      })
    })

    atsSemUpdate.forEach((a: any) => {
      const diasSemUpdate = Math.floor((hoje.getTime() - new Date(a.updated_at || a.created_at || hojeStr).getTime()) / 86400000)
      lista.push({
        id: a.id, href: '/assistencia',
        tipo: 'atencao',
        titulo: `AT do pedido ${(a.pedidos as any)?.numero_pedido || '—'}`,
        detalhe: `Sem atualização há ${diasSemUpdate} dia${diasSemUpdate !== 1 ? 's' : ''}`,
        tag: 'Sem atualização', tagColor: '#633806', tagBg: '#FAEEDA',
      })
    })

    pedidosAtivos.filter((p: any) => aptoIds.has(p.id) && !atrasados.find((a: any) => a.id === p.id)).forEach((p: any) => {
      lista.push({
        id: p.id, href: `/pedidos/${p.id}`,
        tipo: 'atencao',
        titulo: `Pedido ${p.numero_pedido} · ${(p.clientes as any)?.nome || ''}`,
        detalhe: 'Itens prontos — aguardando agendamento de entrega',
        tag: 'Apto p/ agendar', tagColor: '#27500A', tagBg: '#EAF3DE',
      })
    })

    entregasData.forEach((e: any) => {
      lista.push({
        id: e.id, href: '/entregas',
        tipo: 'info',
        titulo: `Entrega amanhã · Pedido ${(e.pedidos as any)?.numero_pedido || '—'}`,
        detalhe: `Cliente: ${(e.pedidos as any)?.clientes?.nome || '—'}`,
        tag: 'Amanhã', tagColor: '#0C447C', tagBg: '#E6F1FB',
      })
    })

    // Distribuição por status
    const countStatus: Record<string, number> = {}
    itensData.forEach((i: any) => { countStatus[i.status] = (countStatus[i.status] || 0) + 1 })
    const grupos = [
      { label: 'Em produção', color: '#185FA5', statuses: ['em_producao', 'compra_confirmada', 'compra_enviada'] },
      { label: 'Em transporte', color: '#C9A84C', statuses: ['em_transporte'] },
      { label: 'Recebimento', color: '#3B6D11', statuses: ['recebido', 'conferido_ok', 'apto_entrega'] },
      { label: 'Com problema', color: '#A32D2D', statuses: ['conferido_com_problema', 'em_at'] },
      { label: 'Outros', color: '#ccc', statuses: ['aguardando_compra', 'entregue'] },
    ]
    const segs = grupos.map(g => ({ label: g.label, color: g.color, value: g.statuses.reduce((s, st) => s + (countStatus[st] || 0), 0) })).filter(s => s.value > 0)

    setAcoes(lista)
    setStatusDist(segs)
    setDados({
      pedidosAndamento: pedidosAtivos.length,
      pedidosAtrasados: atrasados.length,
      aptoEntrega: aptoIds.size,
      atsAbertas: atsData.length,
      entregasAmanha: entregasData.length,
      entreguesMes: (entreguesMes || []).length,
    })
  }

  const primeiroNome = usuario?.nome?.split(' ')[0] || '...'
  const inicial = usuario?.nome?.charAt(0).toUpperCase() || '?'
  const totalItens = statusDist.reduce((s, g) => s + g.value, 0)

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#f7f6f3' }}>
      <Sidebar ativa="/dashboard" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        <div style={{ height: '52px', background: '#fff', borderBottom: '0.5px solid #e8e7e3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', flexShrink: 0 }}>
          <span style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a2e' }}>Dashboard operacional</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ fontSize: '18px', color: '#888' }}>🔔</span>
              {acoes.length > 0 && (
                <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '16px', height: '16px', borderRadius: '50%', background: '#A32D2D', color: '#fff', fontSize: '9px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {acoes.length}
                </div>
              )}
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#C9A84C', fontWeight: '600' }}>
              {inicial}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>

          {/* Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Em andamento', value: dados.pedidosAndamento, color: '#1a1a2e', sub: null },
              { label: 'Atrasados', value: dados.pedidosAtrasados, color: '#A32D2D', sub: dados.pedidosAtrasados > 0 ? 'Acima do prazo' : 'Todos no prazo' },
              { label: 'Apto p/ agendar', value: dados.aptoEntrega, color: '#3B6D11', sub: dados.aptoEntrega > 0 ? 'Pronto para entrega' : null },
              { label: 'ATs abertas', value: dados.atsAbertas, color: '#185FA5', sub: null },
            ].map(card => (
              <div key={card.label} style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', padding: '18px' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>{card.label}</div>
                <div style={{ fontSize: '32px', fontWeight: '600', color: card.color, lineHeight: 1 }}>{card.value}</div>
                {card.sub && <div style={{ fontSize: '11px', color: card.color, marginTop: '6px', opacity: 0.8 }}>{card.sub}</div>}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px' }}>

            {/* Inbox de ações */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '0.5px solid #f0efe9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a2e' }}>Olá, {primeiroNome}</span>
                  <span style={{ fontSize: '13px', color: '#888', marginLeft: '8px' }}>
                    {acoes.length === 0 ? '— tudo em ordem por hoje.' : `— ${acoes.length} item${acoes.length !== 1 ? 'ns' : ''} precisando de atenção.`}
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
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>✓</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a2e', marginBottom: '4px' }}>Nada pendente</div>
                  <div style={{ fontSize: '13px', color: '#888' }}>Todos os pedidos estão dentro do prazo.</div>
                </div>
              ) : (
                acoes.map((acao, i) => (
                  <a
                    key={`${acao.id}-${i}`}
                    href={acao.href}
                    style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', borderTop: '0.5px solid #f0efe9', textDecoration: 'none', borderLeft: `3px solid ${TIPO_STYLE[acao.tipo].border}`, background: i % 2 === 0 ? '#fff' : '#fdfcfb', transition: 'background 0.15s' }}
                  >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: TIPO_STYLE[acao.tipo].dot, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e', marginBottom: '2px' }}>{acao.titulo}</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>{acao.detalhe}</div>
                    </div>
                    <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '6px', fontWeight: '500', background: acao.tagBg, color: acao.tagColor, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {acao.tag}
                    </span>
                    <span style={{ fontSize: '14px', color: '#ccc' }}>→</span>
                  </a>
                ))
              )}
            </div>

            {/* Donut */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', padding: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>Itens por status</div>
              {totalItens === 0 ? (
                <div style={{ textAlign: 'center', color: '#888', fontSize: '13px', padding: '20px 0' }}>Sem dados</div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <DonutChart segments={statusDist} total={dados.pedidosAndamento} />
                  <div style={{ flex: 1 }}>
                    {statusDist.map(seg => (
                      <div key={seg.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
                          <span style={{ fontSize: '12px', color: '#555' }}>{seg.label}</span>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '500', color: '#1a1a2e' }}>{seg.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '0.5px solid #f0efe9' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Este mês</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: '600', color: '#3B6D11' }}>{dados.entreguesMes}</div>
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Entregas</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: '600', color: '#185FA5' }}>{dados.entregasAmanha}</div>
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Amanhã</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: '600', color: '#A32D2D' }}>{dados.pedidosAtrasados}</div>
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Atrasados</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
