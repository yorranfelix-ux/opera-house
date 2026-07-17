'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

const STATUS_AT_LABEL: Record<string, string> = {
  aberta: 'Aberta', aguardando_retirada: 'Aguard. retirada', em_reparo: 'Em reparo',
  enviado_fornecedor: 'No fornecedor', aguardando_devolucao: 'Aguard. devolução',
  resolvida: 'Resolvida', cancelada: 'Cancelada',
}

const STATUS_PEDIDO_LABEL: Record<string, string> = {
  criado: 'Criado', aguardando_compra: 'Aguard. compra', em_producao: 'Em produção',
  em_transporte: 'Em transporte', recebido: 'Recebido', apto_agendamento: 'Apto p/ agendamento',
  agendado: 'Agendado', entregue: 'Entregue', com_at: 'Com AT', cancelado: 'Cancelado',
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
  a.href = url; a.download = nomeArquivo; a.click()
  URL.revokeObjectURL(url)
}

type Aba = 'ats' | 'entregas' | 'ocorrencias' | 'pedidos' | 'prazos' | 'profissionais' | 'fornecedores' | 'tratamentos'

export default function Relatorios() {
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState<Aba>('pedidos')

  // ATs
  const [resumoATs, setResumoATs] = useState<{ status: string; total: number }[]>([])
  const [atsFornecedor, setAtsFornecedor] = useState<{ nome: string; total: number }[]>([])
  const [totalATs, setTotalATs] = useState(0)

  // Entregas
  const [entregasMes, setEntregasMes] = useState<{ mes: string; total: number; realizadas: number }[]>([])
  const [totalEntregas, setTotalEntregas] = useState(0)

  // Ocorrências
  const [ocorrenciasTipo, setOcorrenciasTipo] = useState<{ tipo: string; total: number; abertas: number }[]>([])
  const [totalOcorrencias, setTotalOcorrencias] = useState(0)

  // Pedidos
  const [pedidosStatus, setPedidosStatus] = useState<{ status: string; total: number }[]>([])
  const [pedidosMes, setPedidosMes] = useState<{ mes: string; novos: number; entregues: number }[]>([])
  const [totalPedidos, setTotalPedidos] = useState(0)

  // Prazos
  const [tempoMedioEntrega, setTempoMedioEntrega] = useState<number | null>(null)
  const [dentroPrazo, setDentroPrazo] = useState(0)
  const [foraPrazo, setForaPrazo] = useState(0)

  // Profissionais
  const [porProfissional, setPorProfissional] = useState<{ nome: string; total: number; entregues: number }[]>([])

  // Tratamentos
  const [tratamentos, setTratamentos] = useState<{ label: string; total: number; aptos: number }[]>([])
  const [totalItens, setTotalItens] = useState(0)

  useEffect(() => { buscar() }, [])

  async function buscar() {
    setLoading(true)
    const [atsRes, entregasRes, ocorrenciasRes, pedidosRes, itensRes] = await Promise.all([
      supabase.from('assistencias_tecnicas').select('status, itens_pedido(fornecedores(nome_fantasia, razao_social))').range(0, 9999),
      supabase.from('entregas').select('status, data_agendada, data_realizada').range(0, 9999),
      supabase.from('ocorrencias').select('tipo, status').range(0, 9999),
      supabase.from('pedidos').select('status, data_venda, data_entrega, prazo_prometido, created_at, profissionais(nome)').range(0, 9999),
      supabase.from('itens_pedido').select('requer_icamento, requer_tecido_fornecido, requer_retirada_loja, requer_higienizacao, requer_impermeabilizacao, apto_entrega, status').range(0, 9999),
    ])

    // --- ATs ---
    const ats = (atsRes.data || []) as any[]
    setTotalATs(ats.length)
    const atMap: Record<string, number> = {}
    ats.forEach(a => { atMap[a.status] = (atMap[a.status] || 0) + 1 })
    setResumoATs(Object.entries(atMap).map(([status, total]) => ({ status, total })).sort((a, b) => b.total - a.total))

    const fornMap: Record<string, number> = {}
    ats.forEach(a => {
      const nome = (a.itens_pedido as any)?.fornecedores?.nome_fantasia || (a.itens_pedido as any)?.fornecedores?.razao_social || 'Sem fornecedor'
      fornMap[nome] = (fornMap[nome] || 0) + 1
    })
    setAtsFornecedor(Object.entries(fornMap).map(([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total))

    // --- Entregas ---
    const entregas = (entregasRes.data || []) as any[]
    setTotalEntregas(entregas.length)
    const hoje = new Date()
    const mesesEnt: typeof entregasMes = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const doMes = entregas.filter(e => (e.data_agendada || '').startsWith(mes))
      mesesEnt.push({ mes, total: doMes.length, realizadas: doMes.filter(e => e.status === 'realizada').length })
    }
    setEntregasMes(mesesEnt)

    // --- Ocorrências ---
    const ocorrencias = (ocorrenciasRes.data || []) as any[]
    setTotalOcorrencias(ocorrencias.length)
    const ocMap: Record<string, { total: number; abertas: number }> = {}
    ocorrencias.forEach(o => {
      if (!ocMap[o.tipo]) ocMap[o.tipo] = { total: 0, abertas: 0 }
      ocMap[o.tipo].total++
      if (o.status === 'aberta') ocMap[o.tipo].abertas++
    })
    setOcorrenciasTipo(Object.entries(ocMap).map(([tipo, v]) => ({ tipo, ...v })).sort((a, b) => b.total - a.total))

    // --- Pedidos ---
    const pedidos = (pedidosRes.data || []) as any[]
    setTotalPedidos(pedidos.length)

    const pedMap: Record<string, number> = {}
    pedidos.forEach(p => { pedMap[p.status] = (pedMap[p.status] || 0) + 1 })
    setPedidosStatus(Object.entries(pedMap).map(([status, total]) => ({ status, total })).sort((a, b) => b.total - a.total))

    // Pedidos por mês (últimos 6)
    const mesesPed: typeof pedidosMes = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const novos = pedidos.filter(p => (p.data_venda || p.created_at || '').startsWith(mes)).length
      const entregues = pedidos.filter(p => (p.data_entrega || '').startsWith(mes)).length
      mesesPed.push({ mes, novos, entregues })
    }
    setPedidosMes(mesesPed)

    // --- Prazos ---
    const entreguesComDatas = pedidos.filter(p => p.status === 'entregue' && p.data_venda && p.data_entrega)
    if (entreguesComDatas.length > 0) {
      const totalDias = entreguesComDatas.reduce((acc: number, p: any) => {
        const dias = Math.round((new Date(p.data_entrega).getTime() - new Date(p.data_venda).getTime()) / 86400000)
        return acc + dias
      }, 0)
      setTempoMedioEntrega(Math.round(totalDias / entreguesComDatas.length))
    } else {
      setTempoMedioEntrega(null)
    }

    const entreguesComPrazo = pedidos.filter(p => p.status === 'entregue' && p.data_entrega && p.prazo_prometido)
    let dentro = 0, fora = 0
    entreguesComPrazo.forEach((p: any) => {
      if (new Date(p.data_entrega) <= new Date(p.prazo_prometido)) dentro++
      else fora++
    })
    setDentroPrazo(dentro)
    setForaPrazo(fora)

    // --- Profissionais ---
    const profMap: Record<string, { total: number; entregues: number }> = {}
    pedidos.forEach((p: any) => {
      const nome = p.profissionais?.nome || 'Sem profissional'
      if (!profMap[nome]) profMap[nome] = { total: 0, entregues: 0 }
      profMap[nome].total++
      if (p.status === 'entregue') profMap[nome].entregues++
    })
    setPorProfissional(Object.entries(profMap).map(([nome, v]) => ({ nome, ...v })).sort((a, b) => b.total - a.total))

    // --- Tratamentos ---
    const itens = (itensRes.data || []) as any[]
    setTotalItens(itens.length)
    const flags = [
      { key: 'requer_icamento', label: 'Içamento' },
      { key: 'requer_tecido_fornecido', label: 'Tecido a enviar' },
      { key: 'requer_retirada_loja', label: 'Retirada na loja' },
      { key: 'requer_higienizacao', label: 'Higienização' },
      { key: 'requer_impermeabilizacao', label: 'Impermeabilização' },
    ]
    setTratamentos(flags.map(f => ({
      label: f.label,
      total: itens.filter(i => i[f.key]).length,
      aptos: itens.filter(i => i[f.key] && i.apto_entrega).length,
    })))

    setLoading(false)
  }

  const abas: { id: Aba; label: string }[] = [
    { id: 'pedidos', label: 'Pedidos' },
    { id: 'entregas', label: 'Entregas' },
    { id: 'prazos', label: 'Prazos' },
    { id: 'profissionais', label: 'Profissionais' },
    { id: 'ats', label: 'ATs' },
    { id: 'fornecedores', label: 'ATs p/ Fornecedor' },
    { id: 'ocorrencias', label: 'Ocorrências' },
    { id: 'tratamentos', label: 'Tratamentos' },
  ]

  const cardStyle = (cor: string) => ({
    background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3',
    padding: '16px 20px', borderLeft: `3px solid ${cor}`,
  })

  const headerTabela = (cols: string[], widths: string) => (
    <div style={{ display: 'grid', gridTemplateColumns: widths, padding: '6px 16px', background: '#f7f6f3', fontSize: '10px', fontWeight: '600', color: '#888', textTransform: 'uppercase' as const, letterSpacing: '0.4px', gap: '8px' }}>
      {cols.map((c, i) => <span key={i} style={{ textAlign: i > 0 ? 'right' : 'left' }}>{c}</span>)}
    </div>
  )

  const totalPrazo = dentroPrazo + foraPrazo

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
                <div style={cardStyle('#27500A')}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total de Pedidos</div>
                  <div style={{ fontSize: '28px', fontWeight: '500', color: '#27500A' }}>{totalPedidos}</div>
                </div>
                <div style={cardStyle('#C9A84C')}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total de Entregas</div>
                  <div style={{ fontSize: '28px', fontWeight: '500', color: '#C9A84C' }}>{totalEntregas}</div>
                </div>
                <div style={cardStyle('#185FA5')}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total de ATs</div>
                  <div style={{ fontSize: '28px', fontWeight: '500', color: '#185FA5' }}>{totalATs}</div>
                </div>
                <div style={cardStyle('#A32D2D')}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total de Ocorrências</div>
                  <div style={{ fontSize: '28px', fontWeight: '500', color: '#A32D2D' }}>{totalOcorrencias}</div>
                </div>
              </div>

              {/* Abas */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: '#fff', borderRadius: '10px', padding: '4px', border: '0.5px solid #e8e7e3', flexWrap: 'wrap' }}>
                {abas.map(a => (
                  <button key={a.id} onClick={() => setAba(a.id)}
                    style={{ padding: '7px 14px', borderRadius: '7px', border: 'none', background: aba === a.id ? '#1a1a2e' : 'transparent', color: aba === a.id ? '#C9A84C' : '#888', fontSize: '12px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {a.label}
                  </button>
                ))}
              </div>

              {/* === PEDIDOS === */}
              {aba === 'pedidos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '0.5px solid #f0efe9' }}>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>Pedidos por mês (últimos 6 meses)</span>
                      <button onClick={() => exportarCSV(
                        [['Mês', 'Novos pedidos', 'Entregues'], ...pedidosMes.map(p => [mesLabel(p.mes), String(p.novos), String(p.entregues)])],
                        'pedidos_por_mes.csv'
                      )} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: '#fff', cursor: 'pointer', color: '#555' }}>Exportar CSV</button>
                    </div>
                    {headerTabela(['Mês', 'Novos', 'Entregues'], '120px 1fr 1fr')}
                    {pedidosMes.map((p, i) => (
                      <div key={p.mes} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', padding: '12px 16px', borderTop: '0.5px solid #f0efe9', alignItems: 'center', gap: '8px', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                        <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>{mesLabel(p.mes)}</span>
                        <span style={{ fontSize: '13px', color: '#555', textAlign: 'right' }}>{p.novos}</span>
                        <span style={{ fontSize: '13px', color: '#27500A', textAlign: 'right', fontWeight: '500' }}>{p.entregues}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '0.5px solid #f0efe9' }}>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>Pedidos por status</span>
                      <button onClick={() => exportarCSV(
                        [['Status', 'Total'], ...pedidosStatus.map(p => [STATUS_PEDIDO_LABEL[p.status] || p.status, String(p.total)])],
                        'pedidos_por_status.csv'
                      )} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: '#fff', cursor: 'pointer', color: '#555' }}>Exportar CSV</button>
                    </div>
                    {headerTabela(['Status', 'Total', 'Participação'], '1fr 80px 120px')}
                    {pedidosStatus.map((p, i) => (
                      <div key={p.status} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px', padding: '12px 16px', borderTop: '0.5px solid #f0efe9', alignItems: 'center', gap: '8px', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
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
                </div>
              )}

              {/* === ENTREGAS === */}
              {aba === 'entregas' && (
                <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '0.5px solid #f0efe9' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>Entregas nos últimos 6 meses</span>
                    <button onClick={() => exportarCSV(
                      [['Mês', 'Agendadas', 'Realizadas', 'Taxa'], ...entregasMes.map(e => [mesLabel(e.mes), String(e.total), String(e.realizadas), e.total > 0 ? Math.round(e.realizadas / e.total * 100) + '%' : '—'])],
                      'entregas_por_mes.csv'
                    )} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: '#fff', cursor: 'pointer', color: '#555' }}>Exportar CSV</button>
                  </div>
                  {headerTabela(['Mês', 'Agendadas', 'Realizadas', 'Taxa'], '120px 1fr 1fr 1fr')}
                  {entregasMes.map((e, i) => (
                    <div key={e.mes} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1fr', padding: '12px 16px', borderTop: '0.5px solid #f0efe9', alignItems: 'center', gap: '8px', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>{mesLabel(e.mes)}</span>
                      <span style={{ fontSize: '13px', color: '#555', textAlign: 'right' }}>{e.total}</span>
                      <span style={{ fontSize: '13px', color: '#27500A', textAlign: 'right', fontWeight: '500' }}>{e.realizadas}</span>
                      <span style={{ fontSize: '12px', color: '#888', textAlign: 'right' }}>{e.total > 0 ? Math.round(e.realizadas / e.total * 100) + '%' : '—'}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* === PRAZOS === */}
              {aba === 'prazos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div style={cardStyle('#185FA5')}>
                      <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Tempo médio venda → entrega</div>
                      <div style={{ fontSize: '28px', fontWeight: '500', color: '#185FA5' }}>{tempoMedioEntrega !== null ? `${tempoMedioEntrega} dias` : '—'}</div>
                    </div>
                    <div style={cardStyle('#27500A')}>
                      <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Entregues dentro do prazo</div>
                      <div style={{ fontSize: '28px', fontWeight: '500', color: '#27500A' }}>{dentroPrazo}</div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>{totalPrazo > 0 ? Math.round(dentroPrazo / totalPrazo * 100) + '%' : '—'}</div>
                    </div>
                    <div style={cardStyle('#A32D2D')}>
                      <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Entregues fora do prazo</div>
                      <div style={{ fontSize: '28px', fontWeight: '500', color: '#A32D2D' }}>{foraPrazo}</div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>{totalPrazo > 0 ? Math.round(foraPrazo / totalPrazo * 100) + '%' : '—'}</div>
                    </div>
                  </div>
                  {totalPrazo === 0 && (
                    <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', padding: '32px', textAlign: 'center', color: '#888', fontSize: '13px' }}>
                      Nenhum pedido entregue com prazo prometido registrado ainda.
                    </div>
                  )}
                </div>
              )}

              {/* === PROFISSIONAIS === */}
              {aba === 'profissionais' && (
                <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '0.5px solid #f0efe9' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>Pedidos por profissional / arquiteto</span>
                    <button onClick={() => exportarCSV(
                      [['Profissional', 'Total pedidos', 'Entregues'], ...porProfissional.map(p => [p.nome, String(p.total), String(p.entregues)])],
                      'pedidos_por_profissional.csv'
                    )} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: '#fff', cursor: 'pointer', color: '#555' }}>Exportar CSV</button>
                  </div>
                  {headerTabela(['Profissional', 'Total', 'Entregues', 'Participação'], '1fr 80px 90px 120px')}
                  {porProfissional.map((p, i) => (
                    <div key={p.nome} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px 120px', padding: '12px 16px', borderTop: '0.5px solid #f0efe9', alignItems: 'center', gap: '8px', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                      <span style={{ fontSize: '13px', color: '#1a1a2e' }}>{p.nome}</span>
                      <span style={{ fontSize: '13px', color: '#555', textAlign: 'right', fontWeight: '500' }}>{p.total}</span>
                      <span style={{ fontSize: '13px', color: '#27500A', textAlign: 'right' }}>{p.entregues}</span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <div style={{ width: '60px', height: '6px', background: '#f0efe9', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.round(p.total / totalPedidos * 100)}%`, height: '100%', background: '#3C3489', borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: '#888', minWidth: '30px', textAlign: 'right' }}>{Math.round(p.total / totalPedidos * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* === ATs === */}
              {aba === 'ats' && (
                <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '0.5px solid #f0efe9' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>Assistências por status</span>
                    <button onClick={() => exportarCSV(
                      [['Status', 'Total'], ...resumoATs.map(r => [STATUS_AT_LABEL[r.status] || r.status, String(r.total)])],
                      'ats_por_status.csv'
                    )} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: '#fff', cursor: 'pointer', color: '#555' }}>Exportar CSV</button>
                  </div>
                  {headerTabela(['Status', 'Total', 'Participação'], '1fr 80px 120px')}
                  {resumoATs.map((r, i) => (
                    <div key={r.status} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px', padding: '12px 16px', borderTop: '0.5px solid #f0efe9', alignItems: 'center', gap: '8px', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
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

              {/* === ATs POR FORNECEDOR === */}
              {aba === 'fornecedores' && (
                <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '0.5px solid #f0efe9' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>ATs por fornecedor</span>
                    <button onClick={() => exportarCSV(
                      [['Fornecedor', 'Total ATs'], ...atsFornecedor.map(f => [f.nome, String(f.total)])],
                      'ats_por_fornecedor.csv'
                    )} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: '#fff', cursor: 'pointer', color: '#555' }}>Exportar CSV</button>
                  </div>
                  {headerTabela(['Fornecedor', 'Total', 'Participação'], '1fr 80px 120px')}
                  {atsFornecedor.length === 0 && (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Nenhuma AT registrada.</div>
                  )}
                  {atsFornecedor.map((f, i) => (
                    <div key={f.nome} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px', padding: '12px 16px', borderTop: '0.5px solid #f0efe9', alignItems: 'center', gap: '8px', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                      <span style={{ fontSize: '13px', color: '#1a1a2e' }}>{f.nome}</span>
                      <span style={{ fontSize: '13px', color: '#555', textAlign: 'right', fontWeight: '500' }}>{f.total}</span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <div style={{ width: '60px', height: '6px', background: '#f0efe9', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.round(f.total / totalATs * 100)}%`, height: '100%', background: '#A32D2D', borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: '#888', minWidth: '30px', textAlign: 'right' }}>{Math.round(f.total / totalATs * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* === OCORRÊNCIAS === */}
              {aba === 'ocorrencias' && (
                <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '0.5px solid #f0efe9' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>Ocorrências por tipo</span>
                    <button onClick={() => exportarCSV(
                      [['Tipo', 'Total', 'Abertas'], ...ocorrenciasTipo.map(o => [o.tipo, String(o.total), String(o.abertas)])],
                      'ocorrencias_por_tipo.csv'
                    )} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: '#fff', cursor: 'pointer', color: '#555' }}>Exportar CSV</button>
                  </div>
                  {headerTabela(['Tipo', 'Total', 'Abertas', 'Participação'], '1fr 80px 80px 120px')}
                  {ocorrenciasTipo.length === 0 && (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Nenhuma ocorrência registrada.</div>
                  )}
                  {ocorrenciasTipo.map((o, i) => (
                    <div key={o.tipo} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 120px', padding: '12px 16px', borderTop: '0.5px solid #f0efe9', alignItems: 'center', gap: '8px', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
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

              {/* === TRATAMENTOS === */}
              {aba === 'tratamentos' && (
                <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '0.5px solid #f0efe9' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>Itens com tratamentos especiais</span>
                    <button onClick={() => exportarCSV(
                      [['Tratamento', 'Total itens', 'Já aptos'], ...tratamentos.map(t => [t.label, String(t.total), String(t.aptos)])],
                      'itens_por_tratamento.csv'
                    )} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: '#fff', cursor: 'pointer', color: '#555' }}>Exportar CSV</button>
                  </div>
                  {headerTabela(['Tratamento', 'Total itens', 'Já aptos', '% do total de itens'], '1fr 100px 100px 160px')}
                  {tratamentos.map((t, i) => (
                    <div key={t.label} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 160px', padding: '12px 16px', borderTop: '0.5px solid #f0efe9', alignItems: 'center', gap: '8px', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                      <span style={{ fontSize: '13px', color: '#1a1a2e' }}>{t.label}</span>
                      <span style={{ fontSize: '13px', color: '#555', textAlign: 'right', fontWeight: '500' }}>{t.total}</span>
                      <span style={{ fontSize: '13px', color: '#27500A', textAlign: 'right' }}>{t.aptos}</span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <div style={{ width: '60px', height: '6px', background: '#f0efe9', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: totalItens > 0 ? `${Math.min(Math.round(t.total / totalItens * 100), 100)}%` : '0%', height: '100%', background: '#534AB7', borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: '#888', minWidth: '30px', textAlign: 'right' }}>{totalItens > 0 ? Math.round(t.total / totalItens * 100) + '%' : '—'}</span>
                      </div>
                    </div>
                  ))}
                  <div style={{ padding: '10px 16px', borderTop: '0.5px solid #f0efe9', fontSize: '11px', color: '#aaa' }}>
                    Total de itens cadastrados no sistema: {totalItens}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
