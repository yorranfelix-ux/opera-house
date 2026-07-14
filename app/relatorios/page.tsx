'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

interface ResumoAT {
  status: string
  total: number
}

interface EntregaMes {
  mes: string
  total: number
  realizadas: number
}

interface OcorrenciaTipo {
  tipo: string
  total: number
  abertas: number
}

interface PedidoStatus {
  status: string
  total: number
}

const STATUS_AT_LABEL: Record<string, string> = {
  aberta: 'Aberta',
  aguardando_retirada: 'Aguard. retirada',
  em_reparo: 'Em reparo',
  enviado_fornecedor: 'No fornecedor',
  aguardando_devolucao: 'Aguard. devolução',
  resolvida: 'Resolvida',
  cancelada: 'Cancelada',
}

const STATUS_PEDIDO_LABEL: Record<string, string> = {
  em_aberto: 'Em aberto',
  apto_agendamento: 'Apto p/ agendamento',
  agendado: 'Agendado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

function mesLabel(yyyymm: string) {
  const [y, m] = yyyymm.split('-')
  const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${nomes[parseInt(m) - 1]}/${y.slice(2)}`
}

function exportarCSV(linhas: string[][], nomeArquivo: string) {
  const csv = linhas.map(l => l.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  a.click()
  URL.revokeObjectURL(url)
}

export default function Relatorios() {
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState<'ats' | 'entregas' | 'ocorrencias' | 'pedidos'>('ats')

  const [resumoATs, setResumoATs] = useState<ResumoAT[]>([])
  const [entregasMes, setEntregasMes] = useState<EntregaMes[]>([])
  const [ocorrenciasTipo, setOcorrenciasTipo] = useState<OcorrenciaTipo[]>([])
  const [pedidosStatus, setPedidosStatus] = useState<PedidoStatus[]>([])

  const [totalATs, setTotalATs] = useState(0)
  const [totalEntregas, setTotalEntregas] = useState(0)
  const [totalOcorrencias, setTotalOcorrencias] = useState(0)
  const [totalPedidos, setTotalPedidos] = useState(0)

  useEffect(() => { buscar() }, [])

  async function buscar() {
    setLoading(true)
    const [atsRes, entregasRes, ocorrenciasRes, pedidosRes] = await Promise.all([
      supabase.from('assistencias_tecnicas').select('status, created_at').range(0, 9999),
      supabase.from('entregas').select('status, data_agendada, data_realizada').range(0, 9999),
      supabase.from('ocorrencias').select('tipo, status').range(0, 9999),
      supabase.from('pedidos').select('status').range(0, 9999),
    ])

    if (atsRes.error) console.error('Relatórios ATs:', atsRes.error)
    if (entregasRes.error) console.error('Relatórios Entregas:', entregasRes.error)
    if (ocorrenciasRes.error) console.error('Relatórios Ocorrencias:', ocorrenciasRes.error)
    if (pedidosRes.error) console.error('Relatórios Pedidos:', pedidosRes.error)

    // ATs por status
    const ats = atsRes.data || []
    setTotalATs(ats.length)
    const atMap: Record<string, number> = {}
    ats.forEach((a: any) => { atMap[a.status] = (atMap[a.status] || 0) + 1 })
    setResumoATs(Object.entries(atMap).map(([status, total]) => ({ status, total })).sort((a, b) => b.total - a.total))

    // Entregas por mês (últimos 6 meses)
    const entregas = entregasRes.data || []
    setTotalEntregas(entregas.length)
    const hoje = new Date()
    const meses: EntregaMes[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const doMes = (entregas as any[]).filter((e: any) => {
        const dt = e.data_agendada || e.data_realizada || ''
        return dt.startsWith(mes)
      })
      meses.push({ mes, total: doMes.length, realizadas: doMes.filter((e: any) => e.status === 'realizada').length })
    }
    setEntregasMes(meses)

    // Ocorrências por tipo
    const ocorrencias = ocorrenciasRes.data || []
    setTotalOcorrencias(ocorrencias.length)
    const ocMap: Record<string, { total: number; abertas: number }> = {}
    ocorrencias.forEach((o: any) => {
      if (!ocMap[o.tipo]) ocMap[o.tipo] = { total: 0, abertas: 0 }
      ocMap[o.tipo].total++
      if (o.status === 'aberta') ocMap[o.tipo].abertas++
    })
    setOcorrenciasTipo(Object.entries(ocMap).map(([tipo, v]) => ({ tipo, ...v })).sort((a, b) => b.total - a.total))

    // Pedidos por status
    const pedidos = pedidosRes.data || []
    setTotalPedidos(pedidos.length)
    const pedMap: Record<string, number> = {}
    pedidos.forEach((p: any) => { pedMap[p.status] = (pedMap[p.status] || 0) + 1 })
    setPedidosStatus(Object.entries(pedMap).map(([status, total]) => ({ status, total })).sort((a, b) => b.total - a.total))

    setLoading(false)
  }

  const abas = [
    { id: 'ats', label: 'Assistências Técnicas' },
    { id: 'entregas', label: 'Entregas' },
    { id: 'ocorrencias', label: 'Ocorrências' },
    { id: 'pedidos', label: 'Pedidos' },
  ] as const

  const cardStyle = (cor: string) => ({
    background: '#fff',
    borderRadius: '12px',
    border: '0.5px solid #e8e7e3',
    padding: '16px 20px',
    borderLeft: `3px solid ${cor}`,
  })

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#f7f6f3' }}>
      <Sidebar ativa="/relatorios" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: '52px', background: '#fff', borderBottom: '0.5px solid #e8e7e3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', flexShrink: 0 }}>
          <span style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a2e' }}>Relatórios</span>
          <button onClick={buscar} style={{ padding: '6px 14px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#555' }}>
            Atualizar
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#888', fontSize: '13px', padding: '60px' }}>Carregando dados...</div>
          ) : (
            <>
              {/* Cards de resumo */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div style={cardStyle('#185FA5')}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total de ATs</div>
                  <div style={{ fontSize: '28px', fontWeight: '500', color: '#185FA5' }}>{totalATs}</div>
                </div>
                <div style={cardStyle('#C9A84C')}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total de Entregas</div>
                  <div style={{ fontSize: '28px', fontWeight: '500', color: '#C9A84C' }}>{totalEntregas}</div>
                </div>
                <div style={cardStyle('#A32D2D')}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total de Ocorrências</div>
                  <div style={{ fontSize: '28px', fontWeight: '500', color: '#A32D2D' }}>{totalOcorrencias}</div>
                </div>
                <div style={cardStyle('#27500A')}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total de Pedidos</div>
                  <div style={{ fontSize: '28px', fontWeight: '500', color: '#27500A' }}>{totalPedidos}</div>
                </div>
              </div>

              {/* Abas */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: '#fff', borderRadius: '10px', padding: '4px', border: '0.5px solid #e8e7e3', width: 'fit-content' }}>
                {abas.map(a => (
                  <button key={a.id} onClick={() => setAba(a.id)}
                    style={{ padding: '7px 16px', borderRadius: '7px', border: 'none', background: aba === a.id ? '#1a1a2e' : 'transparent', color: aba === a.id ? '#C9A84C' : '#888', fontSize: '12px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {a.label}
                  </button>
                ))}
              </div>

              {/* Tabelas */}
              {aba === 'ats' && (
                <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '0.5px solid #f0efe9' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>Assistências por status</span>
                    <button onClick={() => exportarCSV(
                      [['Status', 'Total'], ...resumoATs.map(r => [STATUS_AT_LABEL[r.status] || r.status, String(r.total)])],
                      'ats_por_status.csv'
                    )} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: '#fff', cursor: 'pointer', color: '#555' }}>
                      Exportar CSV
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px', padding: '6px 16px', background: '#f7f6f3', fontSize: '10px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    <span>Status</span><span style={{ textAlign: 'right' }}>Total</span><span style={{ textAlign: 'right' }}>Participação</span>
                  </div>
                  {resumoATs.map((r, i) => (
                    <div key={r.status} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px', padding: '12px 16px', borderTop: '0.5px solid #f0efe9', alignItems: 'center', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                      <span style={{ fontSize: '13px', color: '#1a1a2e' }}>{STATUS_AT_LABEL[r.status] || r.status}</span>
                      <span style={{ fontSize: '13px', color: '#555', textAlign: 'right', fontWeight: '500' }}>{r.total}</span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <div style={{ width: '60px', height: '6px', background: '#f0efe9', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.round(r.total / totalATs * 100)}%`, height: '100%', background: '#185FA5', borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: '#888', minWidth: '30px', textAlign: 'right' }}>{Math.round(r.total / totalATs * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {aba === 'entregas' && (
                <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '0.5px solid #f0efe9' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>Entregas nos últimos 6 meses</span>
                    <button onClick={() => exportarCSV(
                      [['Mês', 'Total agendadas', 'Realizadas'], ...entregasMes.map(e => [mesLabel(e.mes), String(e.total), String(e.realizadas)])],
                      'entregas_por_mes.csv'
                    )} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: '#fff', cursor: 'pointer', color: '#555' }}>
                      Exportar CSV
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1fr', padding: '6px 16px', background: '#f7f6f3', fontSize: '10px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    <span>Mês</span><span style={{ textAlign: 'right' }}>Agendadas</span><span style={{ textAlign: 'right' }}>Realizadas</span><span style={{ textAlign: 'right' }}>Taxa</span>
                  </div>
                  {entregasMes.map((e, i) => (
                    <div key={e.mes} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1fr', padding: '12px 16px', borderTop: '0.5px solid #f0efe9', alignItems: 'center', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                      <span style={{ fontSize: '13px', color: '#1a1a2e', fontWeight: '500' }}>{mesLabel(e.mes)}</span>
                      <span style={{ fontSize: '13px', color: '#555', textAlign: 'right' }}>{e.total}</span>
                      <span style={{ fontSize: '13px', color: '#27500A', textAlign: 'right', fontWeight: '500' }}>{e.realizadas}</span>
                      <span style={{ fontSize: '12px', color: '#888', textAlign: 'right' }}>{e.total > 0 ? Math.round(e.realizadas / e.total * 100) + '%' : '—'}</span>
                    </div>
                  ))}
                </div>
              )}

              {aba === 'ocorrencias' && (
                <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '0.5px solid #f0efe9' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>Ocorrências por tipo</span>
                    <button onClick={() => exportarCSV(
                      [['Tipo', 'Total', 'Abertas'], ...ocorrenciasTipo.map(o => [o.tipo, String(o.total), String(o.abertas)])],
                      'ocorrencias_por_tipo.csv'
                    )} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: '#fff', cursor: 'pointer', color: '#555' }}>
                      Exportar CSV
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 120px', padding: '6px 16px', background: '#f7f6f3', fontSize: '10px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    <span>Tipo</span><span style={{ textAlign: 'right' }}>Total</span><span style={{ textAlign: 'right' }}>Abertas</span><span style={{ textAlign: 'right' }}>Participação</span>
                  </div>
                  {ocorrenciasTipo.length === 0 && (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Nenhuma ocorrência registrada.</div>
                  )}
                  {ocorrenciasTipo.map((o, i) => (
                    <div key={o.tipo} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 120px', padding: '12px 16px', borderTop: '0.5px solid #f0efe9', alignItems: 'center', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                      <span style={{ fontSize: '13px', color: '#1a1a2e' }}>{o.tipo}</span>
                      <span style={{ fontSize: '13px', color: '#555', textAlign: 'right', fontWeight: '500' }}>{o.total}</span>
                      <span style={{ fontSize: '13px', color: o.abertas > 0 ? '#A32D2D' : '#888', textAlign: 'right' }}>{o.abertas}</span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <div style={{ width: '60px', height: '6px', background: '#f0efe9', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.round(o.total / totalOcorrencias * 100)}%`, height: '100%', background: '#A32D2D', borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: '#888', minWidth: '30px', textAlign: 'right' }}>{Math.round(o.total / totalOcorrencias * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {aba === 'pedidos' && (
                <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '0.5px solid #f0efe9' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>Pedidos por status</span>
                    <button onClick={() => exportarCSV(
                      [['Status', 'Total'], ...pedidosStatus.map(p => [STATUS_PEDIDO_LABEL[p.status] || p.status, String(p.total)])],
                      'pedidos_por_status.csv'
                    )} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: '#fff', cursor: 'pointer', color: '#555' }}>
                      Exportar CSV
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px', padding: '6px 16px', background: '#f7f6f3', fontSize: '10px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    <span>Status</span><span style={{ textAlign: 'right' }}>Total</span><span style={{ textAlign: 'right' }}>Participação</span>
                  </div>
                  {pedidosStatus.map((p, i) => (
                    <div key={p.status} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px', padding: '12px 16px', borderTop: '0.5px solid #f0efe9', alignItems: 'center', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                      <span style={{ fontSize: '13px', color: '#1a1a2e' }}>{STATUS_PEDIDO_LABEL[p.status] || p.status}</span>
                      <span style={{ fontSize: '13px', color: '#555', textAlign: 'right', fontWeight: '500' }}>{p.total}</span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <div style={{ width: '60px', height: '6px', background: '#f0efe9', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.round(p.total / totalPedidos * 100)}%`, height: '100%', background: '#27500A', borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: '#888', minWidth: '30px', textAlign: 'right' }}>{Math.round(p.total / totalPedidos * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
