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
  fornecedores_principal?: string
  tag?: string
  entrega_data?: string
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
          <circle
            key={i}
            cx="70" cy="70" r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="16"
            strokeDasharray={`${Math.max(0, dash)} ${circ}`}
            strokeDashoffset={-o + circ * 0.25}
            strokeLinecap="butt"
          />
        )
      })}
      <text x="70" y="66" textAnchor="middle" fontSize="22" fontWeight="600" fill="#1a1a2e">{total}</text>
      <text x="70" y="82" textAnchor="middle" fontSize="10" fill="#888">pedidos</text>
    </svg>
  )
}

export default function Dashboard() {
  const [dados, setDados] = useState({
    pedidosAndamento: 0,
    pedidosAtrasados: 0,
    aptoEntrega: 0,
    atsAbertas: 0,
    atsSemAtualizacao: 0,
    entregasAmanha: 0,
    semanaAnteriorPedidos: 0,
    semanaAtualPedidos: 0,
  })
  const [pedidosAtencao, setPedidosAtencao] = useState<PedidoResumo[]>([])
  const [statusDist, setStatusDist] = useState<DonutSegment[]>([])

  useEffect(() => { buscar() }, [])

  async function buscar() {
    const hoje = new Date()
    const hojeStr = hoje.toISOString().split('T')[0]
    const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1)
    const amanhaStr = amanha.toISOString().split('T')[0]
    const seteDiasAtras = new Date(hoje); seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)
    const seteDiasAtrasStr = seteDiasAtras.toISOString().split('T')[0]
    const inicioSemana = new Date(hoje); inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay())
    const inicioSemanaAnterior = new Date(inicioSemana); inicioSemanaAnterior.setDate(inicioSemanaAnterior.getDate() - 7)

    const [
      { data: pedidos },
      { data: itens },
      { data: ats },
      { data: entregas },
    ] = await Promise.all([
      supabase.from('pedidos').select('*, clientes(nome, cidade, estado)').not('status', 'in', '(entregue,cancelado)'),
      supabase.from('itens_pedido').select('id, apto_entrega, pedido_id, tem_at, status'),
      supabase.from('assistencias_tecnicas').select('id, status, updated_at').in('status', ['aberta', 'aguardando_retirada', 'em_reparo', 'enviado_fornecedor', 'aguardando_devolucao']),
      supabase.from('entregas').select('*, pedidos(numero_pedido, clientes(nome, cidade, estado))').eq('data_agendada', amanhaStr),
    ])

    const pedidosAtivos = (pedidos || []) as any[]
    const itensData = (itens || []) as any[]
    const atsData = (ats || []) as any[]

    const atrasados = pedidosAtivos.filter(p => p.prazo_prometido && p.prazo_prometido < hojeStr)
    const aptoIds = new Set(itensData.filter(i => i.apto_entrega).map(i => i.pedido_id))
    const comAtIds = new Set(itensData.filter(i => i.tem_at).map(i => i.pedido_id))
    const atsSemUpdate = atsData.filter(a => {
      if (!a.updated_at) return true
      return new Date(a.updated_at) < seteDiasAtras
    })

    // Pedidos com atenção
    const atencao: PedidoResumo[] = []
    atrasados.slice(0, 3).forEach(p => atencao.push({ ...p, tag: 'atrasado' }))
    pedidosAtivos.filter(p => comAtIds.has(p.id) && !atrasados.find(a => a.id === p.id)).slice(0, 2).forEach(p => atencao.push({ ...p, tag: 'com_at' }))
    pedidosAtivos.filter(p => aptoIds.has(p.id) && !atrasados.find(a => a.id === p.id)).slice(0, 2).forEach(p => atencao.push({ ...p, tag: 'apto' }))

    // Distribuição por status dos itens
    const countStatus: Record<string, number> = {}
    itensData.forEach(i => { countStatus[i.status] = (countStatus[i.status] || 0) + 1 })

    const grupos = [
      { label: 'Em produção', color: '#185FA5', statuses: ['em_producao', 'compra_confirmada', 'compra_enviada'] },
      { label: 'Em transporte', color: '#C9A84C', statuses: ['em_transporte'] },
      { label: 'Recebimento', color: '#3B6D11', statuses: ['recebido', 'conferido_ok', 'apto_entrega'] },
      { label: 'Atrasados', color: '#A32D2D', statuses: ['conferido_com_problema', 'em_at'] },
      { label: 'Outros', color: '#ccc', statuses: ['aguardando_compra', 'entregue'] },
    ]

    const segs: DonutSegment[] = grupos.map(g => ({
      label: g.label,
      color: g.color,
      value: g.statuses.reduce((s, st) => s + (countStatus[st] || 0), 0),
    })).filter(s => s.value > 0)

    setDados({
      pedidosAndamento: pedidosAtivos.length,
      pedidosAtrasados: atrasados.length,
      aptoEntrega: aptoIds.size,
      atsAbertas: atsData.length,
      atsSemAtualizacao: atsSemUpdate.length,
      entregasAmanha: (entregas || []).length,
      semanaAnteriorPedidos: 0,
      semanaAtualPedidos: 0,
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
    agendado: { bg: '#E6F1FB', color: '#0C447C', label: 'Agendado' },
  }

  const SEMAFORO_COLOR: Record<string, string> = {
    verde: '#3B6D11', amarelo: '#BA7517', vermelho: '#A32D2D', azul: '#185FA5', roxo: '#534AB7',
  }

  const totalItens = statusDist.reduce((s, g) => s + g.value, 0)

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#f7f6f3' }}>
      <Sidebar ativa="/dashboard" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        <div style={{ height: '52px', background: '#fff', borderBottom: '0.5px solid #e8e7e3', display: 'flex', alignItems: 'center', padding: '0 22px', fontSize: '15px', fontWeight: '500', color: '#1a1a2e', flexShrink: 0 }}>
          Dashboard operacional
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>

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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Pedidos em andamento', value: dados.pedidosAndamento, color: '#1a1a2e', icon: '📋', sub: null },
              { label: 'Pedidos atrasados', value: dados.pedidosAtrasados, color: '#A32D2D', icon: '⏰', sub: dados.pedidosAtrasados > 0 ? `${dados.pedidosAtrasados} acima do prazo` : 'Todos no prazo' },
              { label: 'Apto para agendar', value: dados.aptoEntrega, color: '#3B6D11', icon: '✓', sub: dados.aptoEntrega > 0 ? 'Pronto para entrega' : null },
              { label: 'ATs abertas', value: dados.atsAbertas, color: '#185FA5', icon: '⚙', sub: dados.atsSemAtualizacao > 0 ? `${dados.atsSemAtualizacao} sem atualização` : null },
            ].map(card => (
              <div key={card.label} style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', padding: '18px' }}>
                <div style={{ fontSize: '13px', color: '#888', marginBottom: '10px' }}>{card.icon} {card.label}</div>
                <div style={{ fontSize: '32px', fontWeight: '600', color: card.color, lineHeight: 1 }}>{card.value}</div>
                {card.sub && (
                  <div style={{ fontSize: '11px', color: card.color === '#1a1a2e' ? '#888' : card.color, marginTop: '6px', opacity: 0.8 }}>
                    ↑ {card.sub}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px' }}>

            <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '0.5px solid #f0efe9' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚠ Pedidos com atenção</span>
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
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>⬤ Pedidos por status</div>
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
