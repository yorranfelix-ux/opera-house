'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

interface PedidoResumo {
  id: string
  numero_pedido: string
  status: string
  semaforo: string
  prazo_prometido: string
  clientes: { nome: string; cidade: string; estado: string }
  tag?: string
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
  const gap = 2
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      {segments.map((seg, i) => {
        const pct = total > 0 ? seg.value / total : 0
        const dash = pct * circ - gap
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

function saudacao() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function Dashboard() {
  const [usuario, setUsuario] = useState<{ nome: string; cargo: string } | null>(null)
  const [dados, setDados] = useState({
    pedidosAndamento: 0,
    pedidosAtrasados: 0,
    aptoEntrega: 0,
    atsAbertas: 0,
    atsSemAtualizacao: 0,
    entregasAmanha: 0,
    entreguesMes: 0,
  })
  const [pedidosAtencao, setPedidosAtencao] = useState<PedidoResumo[]>([])
  const [statusDist, setStatusDist] = useState<DonutSegment[]>([])

  useEffect(() => {
    buscarUsuario()
    buscar()
  }, [])

  async function buscarUsuario() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('nome, cargo').eq('id', user.id).single()
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
      supabase.from('pedidos').select('*, clientes(nome, cidade, estado)').not('status', 'in', '(entregue,cancelado)'),
      supabase.from('itens_pedido').select('id, apto_entrega, pedido_id, tem_at, status'),
      supabase.from('assistencias_tecnicas').select('id, status, updated_at').in('status', ['aberta', 'aguardando_retirada', 'em_reparo', 'enviado_fornecedor', 'aguardando_devolucao']),
      supabase.from('entregas').select('id').eq('data_agendada', amanhaStr),
      supabase.from('pedidos').select('id').eq('status', 'entregue').gte('updated_at', inicioMes),
    ])

    const pedidosAtivos = (pedidos || []) as any[]
    const itensData = (itens || []) as any[]
    const atsData = (ats || []) as any[]

    const atrasados = pedidosAtivos.filter(p => p.prazo_prometido && p.prazo_prometido < hojeStr)
    const aptoIds = new Set(itensData.filter(i => i.apto_entrega).map(i => i.pedido_id))
    const comAtIds = new Set(itensData.filter(i => i.tem_at).map(i => i.pedido_id))
    const atsSemUpdate = atsData.filter(a => !a.updated_at || new Date(a.updated_at) < seteDiasAtras)

    const atencao: PedidoResumo[] = []
    atrasados.slice(0, 3).forEach((p: any) => atencao.push({ ...p, tag: 'atrasado' }))
    pedidosAtivos.filter((p: any) => comAtIds.has(p.id) && !atrasados.find((a: any) => a.id === p.id)).slice(0, 2).forEach((p: any) => atencao.push({ ...p, tag: 'com_at' }))
    pedidosAtivos.filter((p: any) => aptoIds.has(p.id) && !atrasados.find((a: any) => a.id === p.id)).slice(0, 2).forEach((p: any) => atencao.push({ ...p, tag: 'apto' }))

    const countStatus: Record<string, number> = {}
    itensData.forEach((i: any) => { countStatus[i.status] = (countStatus[i.status] || 0) + 1 })

    const grupos = [
      { label: 'Em produção', color: '#185FA5', statuses: ['em_producao', 'compra_confirmada', 'compra_enviada'] },
      { label: 'Em transporte', color: '#C9A84C', statuses: ['em_transporte'] },
      { label: 'Recebimento', color: '#3B6D11', statuses: ['recebido', 'conferido_ok', 'apto_entrega'] },
      { label: 'Com problema', color: '#A32D2D', statuses: ['conferido_com_problema', 'em_at'] },
      { label: 'Outros', color: '#ccc', statuses: ['aguardando_compra', 'entregue'] },
    ]

    const segs = grupos.map(g => ({
      label: g.label, color: g.color,
      value: g.statuses.reduce((s, st) => s + (countStatus[st] || 0), 0),
    })).filter(s => s.value > 0)

    setDados({
      pedidosAndamento: pedidosAtivos.length,
      pedidosAtrasados: atrasados.length,
      aptoEntrega: aptoIds.size,
      atsAbertas: atsData.length,
      atsSemAtualizacao: atsSemUpdate.length,
      entregasAmanha: (entregas || []).length,
      entreguesMes: (entreguesMes || []).length,
    })
    setPedidosAtencao(atencao)
    setStatusDist(segs)
  }

  const chips = [
    dados.pedidosAtrasados > 0 && { label: `${dados.pedidosAtrasados} pedido${dados.pedidosAtrasados !== 1 ? 's' : ''} atrasado${dados.pedidosAtrasados !== 1 ? 's' : ''}`, color: '#A32D2D', bg: '#FCEBEB', icon: '⏰' },
    dados.atsSemAtualizacao > 0 && { label: `${dados.atsSemAtualizacao} AT${dados.atsSemAtualizacao !== 1 ? 's' : ''} sem atualização`, color: '#633806', bg: '#FAEEDA', icon: '⚙' },
    dados.aptoEntrega > 0 && { label: `${dados.aptoEntrega} pedido${dados.aptoEntrega !== 1 ? 's' : ''} apto${dados.aptoEntrega !== 1 ? 's' : ''} para agendar`, color: '#27500A', bg: '#EAF3DE', icon: '✓' },
    dados.entregasAmanha > 0 && { label: `${dados.entregasAmanha} entrega${dados.entregasAmanha !== 1 ? 's' : ''} amanhã`, color: '#0C447C', bg: '#E6F1FB', icon: '🚚' },
  ].filter(Boolean) as { label: string; color: string; bg: string; icon: string }[]

  const TAG_COR: Record<string, { bg: string; color: string; label: string }> = {
    atrasado: { bg: '#FCEBEB', color: '#791F1F', label: 'Atrasado' },
    com_at: { bg: '#EEEDFE', color: '#3C3489', label: 'Com AT' },
    apto: { bg: '#EAF3DE', color: '#27500A', label: 'Apto agendar' },
  }

  const SEMAFORO_COLOR: Record<string, string> = {
    verde: '#3B6D11', amarelo: '#BA7517', vermelho: '#A32D2D', azul: '#185FA5', roxo: '#534AB7',
  }

  const totalItens = statusDist.reduce((s, g) => s + g.value, 0)
  const primeiroNome = usuario?.nome?.split(' ')[0] || '...'
  const inicial = usuario?.nome?.charAt(0).toUpperCase() || '?'
  const pedidosAtencaoCount = pedidosAtencao.length

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#f7f6f3' }}>
      <Sidebar ativa="/dashboard" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{ height: '52px', background: '#fff', borderBottom: '0.5px solid #e8e7e3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', flexShrink: 0 }}>
          <span style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a2e' }}>Dashboard operacional</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <span style={{ fontSize: '18px', color: '#888' }}>🔔</span>
              {pedidosAtencaoCount > 0 && (
                <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '16px', height: '16px', borderRadius: '50%', background: '#A32D2D', color: '#fff', fontSize: '9px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {pedidosAtencaoCount}
                </div>
              )}
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#C9A84C', fontWeight: '600', cursor: 'pointer' }}>
              {inicial}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>

          {/* Hero card */}
          <div style={{ background: '#1a1a2e', borderRadius: '16px', padding: '24px 28px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#6a6a8a', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '4px' }}>{saudacao()}</div>
                <div style={{ fontSize: '22px', fontWeight: '600', color: '#fff', marginBottom: '6px' }}>Bem-vindo, {primeiroNome}!</div>
                <div style={{ fontSize: '13px', color: '#8888aa', marginBottom: '18px' }}>
                  {pedidosAtencaoCount > 0
                    ? `Você tem ${pedidosAtencaoCount} pedido${pedidosAtencaoCount !== 1 ? 's' : ''} precisando de atenção hoje.`
                    : 'Tudo em ordem por hoje.'}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a href="/pedidos" style={{ padding: '8px 16px', borderRadius: '8px', background: '#C9A84C', color: '#1a1a2e', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>
                    Ver pedidos urgentes
                  </a>
                  <a href="/entregas" style={{ padding: '8px 16px', borderRadius: '8px', background: '#252540', color: '#8888aa', fontSize: '12px', fontWeight: '500', textDecoration: 'none' }}>
                    Ver entregas
                  </a>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '28px', flexShrink: 0 }}>
                {[
                  { label: 'Em andamento', value: dados.pedidosAndamento, color: '#fff' },
                  { label: 'Atrasados', value: dados.pedidosAtrasados, color: '#A32D2D' },
                  { label: 'Entregues/mês', value: dados.entreguesMes, color: '#C9A84C' },
                  { label: 'ATs abertas', value: dados.atsAbertas, color: '#6a6aaa' },
                ].map(stat => (
                  <div key={stat.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: '600', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontSize: '11px', color: '#6a6a8a', marginTop: '4px' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chips */}
          {chips.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {chips.map((chip, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', background: chip.bg, border: `0.5px solid ${chip.color}30`, fontSize: '12px', fontWeight: '500', color: chip.color }}>
                  <span style={{ fontSize: '11px' }}>{chip.icon}</span>
                  {chip.label}
                </div>
              ))}
            </div>
          )}

          {/* Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Pedidos em andamento', value: dados.pedidosAndamento, color: '#1a1a2e', sub: null },
              { label: 'Pedidos atrasados', value: dados.pedidosAtrasados, color: '#A32D2D', sub: dados.pedidosAtrasados > 0 ? 'Acima do prazo' : 'Todos no prazo' },
              { label: 'Aguard. agendamento', value: dados.aptoEntrega, color: '#3B6D11', sub: dados.aptoEntrega > 0 ? 'Apto agora' : null },
              { label: 'ATs abertas', value: dados.atsAbertas, color: '#185FA5', sub: dados.atsSemAtualizacao > 0 ? `${dados.atsSemAtualizacao} sem atualização` : null },
            ].map(card => (
              <div key={card.label} style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', padding: '18px' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>{card.label}</div>
                <div style={{ fontSize: '32px', fontWeight: '600', color: card.color, lineHeight: 1 }}>{card.value}</div>
                {card.sub && (
                  <div style={{ fontSize: '11px', color: card.color, marginTop: '6px', opacity: 0.8 }}>↑ {card.sub}</div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '0.5px solid #f0efe9' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pedidos com atenção</span>
                <a href="/pedidos" style={{ fontSize: '12px', color: '#C9A84C', textDecoration: 'none' }}>Ver todos</a>
              </div>
              {pedidosAtencao.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Nenhum pedido requer atenção no momento.</div>
              ) : (
                pedidosAtencao.map((p, i) => (
                  <a key={p.id} href={`/pedidos/${p.id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderTop: i > 0 ? '0.5px solid #f0efe9' : 'none', textDecoration: 'none', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: SEMAFORO_COLOR[p.semaforo] || '#ccc', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '500', color: '#C9A84C' }}>#{p.numero_pedido}</span>
                        <span style={{ fontSize: '12px', color: '#1a1a2e' }}>{p.clientes?.nome}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#888' }}>
                        {p.clientes?.cidade} · {p.prazo_prometido ? `Prazo: ${new Date(p.prazo_prometido + 'T12:00:00').toLocaleDateString('pt-BR')}` : ''}
                      </div>
                    </div>
                    {p.tag && (
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', fontWeight: '500', background: TAG_COR[p.tag]?.bg, color: TAG_COR[p.tag]?.color, whiteSpace: 'nowrap' }}>
                        {TAG_COR[p.tag]?.label}
                      </span>
                    )}
                  </a>
                ))
              )}
            </div>

            <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', padding: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>Pedidos por status</div>
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
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
