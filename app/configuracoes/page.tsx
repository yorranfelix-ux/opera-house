'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

// ── Tipos do visualizador ─────────────────────────────────────────────────────
interface BackupDados {
  pedidos: any[]
  itens: any[]
  clientes: any[]
  fornecedores: any[]
  profissionais: any[]
  ats: any[]
  ocorrencias: any[]
  entregas: any[]
}

interface BackupJson {
  exportadoEm: string
  versao: string
  dados: BackupDados
}

type TabelaKey = keyof BackupDados

const TABELAS: { key: TabelaKey; label: string; icon: string }[] = [
  { key: 'pedidos',      label: 'Pedidos',       icon: '📋' },
  { key: 'itens',        label: 'Itens',          icon: '📦' },
  { key: 'clientes',     label: 'Clientes',       icon: '👤' },
  { key: 'fornecedores', label: 'Fornecedores',   icon: '🏭' },
  { key: 'profissionais',label: 'Profissionais',  icon: '🛠️' },
  { key: 'ats',          label: 'Assistências',   icon: '🔧' },
  { key: 'ocorrencias',  label: 'Ocorrências',    icon: '⚠️' },
  { key: 'entregas',     label: 'Entregas',       icon: '🚚' },
]

const STATUS_COLORS: Record<string, string> = {
  entregue: '#3B6D11', resolvida: '#3B6D11', realizada: '#3B6D11',
  'em reparo': '#BA7517', 'aguard. retirada': '#BA7517', pendente: '#BA7517', aberta: '#BA7517',
  cancelado: '#A32D2D', cancelada: '#A32D2D',
  'em produção': '#1a4fa0', 'em transporte': '#1a4fa0',
  'apto entrega': '#3B6D11', criado: '#666', criada: '#666',
}
const STATUS_BG: Record<string, string> = {
  entregue: '#e8f5e2', resolvida: '#e8f5e2', realizada: '#e8f5e2',
  'em reparo': '#fff3cd', 'aguard. retirada': '#fff3cd', pendente: '#fff3cd', aberta: '#fff3cd',
  cancelado: '#fce8e8', cancelada: '#fce8e8',
  'em produção': '#e5eeff', 'em transporte': '#e5eeff',
  'apto entrega': '#e8f5e2', criado: '#f0efe9', criada: '#f0efe9',
}

function formatarCelula(val: any, col: string): string {
  if (val === null || val === undefined) return '<span style="color:#bbb">—</span>'
  if (typeof val === 'boolean') {
    return val
      ? '<span style="background:#e8f5e2;color:#2d6a0e;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:500">Sim</span>'
      : '<span style="background:#f0efe9;color:#888;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:500">Não</span>'
  }
  const s = String(val)
  if (col === 'status') {
    const key = s.toLowerCase()
    const color = STATUS_COLORS[key] || '#555'
    const bg = STATUS_BG[key] || '#f0efe9'
    return `<span style="background:${bg};color:${color};padding:2px 8px;border-radius:99px;font-size:11px;font-weight:500">${s}</span>`
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    try { return new Date(s).toLocaleDateString('pt-BR') } catch { return s }
  }
  return s.length > 45 ? s.slice(0, 45) + '…' : s
}

// ── Componente do visualizador ────────────────────────────────────────────────
function VisualizadorBackup({ onFechar }: { onFechar: () => void }) {
  const [backup, setBackup] = useState<BackupJson | null>(null)
  const [tabelaAtiva, setTabelaAtiva] = useState<TabelaKey>('pedidos')
  const [busca, setBusca] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const tbodyRef = useRef<HTMLTableSectionElement>(null)
  const theadRef = useRef<HTMLTableSectionElement>(null)
  const countRef = useRef<HTMLSpanElement>(null)

  const carregarArquivo = (file: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const json: BackupJson = JSON.parse(e.target?.result as string)
        setBackup(json)
        setBusca('')
        setTabelaAtiva('pedidos')
      } catch {
        alert('Arquivo inválido. Use o arquivo gerado pelo sistema em Configurações → Backup de dados.')
      }
    }
    reader.readAsText(file)
  }

  const colunas = useCallback((key: TabelaKey): string[] => {
    if (!backup) return []
    const rows = backup.dados[key] || []
    if (rows.length === 0) return []
    return Object.keys(rows[0]).slice(0, 9)
  }, [backup])

  const renderTabela = useCallback(() => {
    if (!backup || !tbodyRef.current || !theadRef.current) return
    const dados = backup.dados[tabelaAtiva] || []
    const q = busca.toLowerCase().trim()
    const filtrados = q
      ? dados.filter(row => Object.values(row).some(v => v !== null && String(v).toLowerCase().includes(q)))
      : dados
    const cols = colunas(tabelaAtiva)
    if (countRef.current) countRef.current.textContent = `${filtrados.length} registro${filtrados.length !== 1 ? 's' : ''}`
    theadRef.current.innerHTML = '<tr>' + cols.map(c =>
      `<th style="position:sticky;top:0;background:#fff;border-bottom:0.5px solid #e8e7e3;padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.4px;white-space:nowrap;z-index:1">${c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</th>`
    ).join('') + '</tr>'
    tbodyRef.current.innerHTML = filtrados.length === 0
      ? `<tr><td colspan="${cols.length}" style="padding:40px;text-align:center;color:#bbb;font-size:13px">Nenhum resultado encontrado</td></tr>`
      : filtrados.map(row =>
          '<tr style="border-bottom:0.5px solid #f0efe9">' +
          cols.map((col, i) =>
            `<td style="padding:11px 16px;font-size:13px;color:${i === 0 ? '#1a1a2e' : '#555'};font-weight:${i === 0 ? '500' : '400'};white-space:nowrap">${formatarCelula(row[col], col)}</td>`
          ).join('') + '</tr>'
        ).join('')
  }, [backup, tabelaAtiva, busca, colunas])

  useEffect(() => { renderTabela() }, [renderTabela])

  // Fechar com Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onFechar() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onFechar])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#f7f6f3', borderRadius: '16px', width: 'calc(100vw - 48px)', height: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.25)' }}>

        {/* Topbar do modal */}
        <div style={{ height: '52px', background: '#fff', borderBottom: '0.5px solid #e8e7e3', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '14px', flexShrink: 0, borderRadius: '16px 16px 0 0' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a2e', flex: 1 }}>📦 Visualizador de Backup</span>
          {backup && (
            <span style={{ fontSize: '11px', color: '#888' }}>
              Exportado em <strong style={{ color: '#555' }}>{new Date(backup.exportadoEm).toLocaleDateString('pt-BR')} {new Date(backup.exportadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong>
            </span>
          )}
          {backup && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f7f6f3', border: '0.5px solid #e8e7e3', borderRadius: '8px', padding: '0 12px', height: '34px', width: '220px' }}>
              <span style={{ color: '#aaa', fontSize: '13px' }}>🔍</span>
              <input
                type="text"
                placeholder="Buscar em qualquer campo..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', color: '#1a1a2e', width: '100%' }}
              />
            </div>
          )}
          <label style={{ height: '34px', padding: '0 14px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#f7f6f3', color: '#555', fontSize: '12px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ⬆ {backup ? 'Trocar arquivo' : 'Carregar backup'}
            <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) carregarArquivo(f) }} />
          </label>
          <button onClick={onFechar} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#f7f6f3', color: '#888', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>
        </div>

        {!backup ? (
          /* Drop zone */
          <div
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) carregarArquivo(f) }}
          >
            <div
              onClick={() => fileRef.current?.click()}
              style={{ background: '#fff', border: '1.5px dashed #e8e7e3', borderRadius: '16px', padding: '52px 72px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', textAlign: 'center' }}
            >
              <div style={{ fontSize: '40px', opacity: 0.5 }}>📂</div>
              <div style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a2e' }}>Carregar arquivo de backup</div>
              <div style={{ fontSize: '12px', color: '#888', lineHeight: 1.7 }}>
                Selecione o arquivo <strong>backup-operahouse-YYYY-MM-DD.json</strong><br />
                baixado em Configurações → Backup de dados<br />
                ou arraste o arquivo aqui
              </div>
              <div style={{ marginTop: '6px', padding: '7px 20px', borderRadius: '8px', background: '#1a1a2e', color: '#C9A84C', fontSize: '12px', fontWeight: '500' }}>
                Selecionar arquivo
              </div>
            </div>
          </div>
        ) : (
          /* Layout com sidebar + tabela */
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Sidebar de tabelas */}
            <div style={{ width: '180px', flexShrink: 0, background: '#fff', borderRight: '0.5px solid #e8e7e3', padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ fontSize: '10px', fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '6px 10px 4px' }}>Tabelas</div>
              {TABELAS.map(t => {
                const count = (backup.dados[t.key] || []).length
                const ativa = tabelaAtiva === t.key
                return (
                  <button
                    key={t.key}
                    onClick={() => { setTabelaAtiva(t.key); setBusca('') }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', border: 'none', background: ativa ? 'rgba(201,168,76,0.12)' : 'none', color: ativa ? '#C9A84C' : '#555', fontWeight: ativa ? '500' : '400', fontSize: '13px', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span>{t.icon} {t.label}</span>
                    <span style={{ fontSize: '11px', fontWeight: '600', background: ativa ? 'rgba(201,168,76,0.2)' : '#f0efe9', color: ativa ? '#C9A84C' : '#aaa', borderRadius: '99px', padding: '1px 7px' }}>{count}</span>
                  </button>
                )
              })}
            </div>

            {/* Área da tabela */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '12px 20px', borderBottom: '0.5px solid #e8e7e3', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a2e' }}>
                  {TABELAS.find(t => t.key === tabelaAtiva)?.icon} {TABELAS.find(t => t.key === tabelaAtiva)?.label}
                </span>
                <span ref={countRef} style={{ fontSize: '12px', color: '#888' }} />
              </div>
              <div style={{ flex: 1, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead ref={theadRef as any} />
                  <tbody ref={tbodyRef as any} />
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Componente de limpeza ─────────────────────────────────────────────────────
interface ResumoLimpeza {
  pedidosIds: string[]
  totalPedidos: number
  totalItens: number
  totalATs: number
  totalOcorrencias: number
  totalEntregas: number
  totalHistorico: number
}

function LimpezaCard() {
  const anoAtual = new Date().getFullYear()
  const anos = Array.from({ length: 5 }, (_, i) => anoAtual - 1 - i)
  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual - 1)
  const [resumo, setResumo] = useState<ResumoLimpeza | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [confirmacao, setConfirmacao] = useState('')
  const [excluindo, setExcluindo] = useState(false)
  const [concluido, setConcluido] = useState(false)

  async function buscarResumo() {
    setBuscando(true)
    setResumo(null)
    setConfirmacao('')
    setConcluido(false)
    try {
      const inicio = `${anoSelecionado}-01-01`
      const fim = `${anoSelecionado}-12-31`
      const { data: pedidos } = await supabase
        .from('pedidos')
        .select('id')
        .in('status', ['entregue', 'cancelado'])
        .gte('created_at', inicio)
        .lte('created_at', fim + 'T23:59:59')
        .range(0, 9999)

      if (!pedidos || pedidos.length === 0) {
        setResumo({ pedidosIds: [], totalPedidos: 0, totalItens: 0, totalATs: 0, totalOcorrencias: 0, totalEntregas: 0, totalHistorico: 0 })
        setBuscando(false)
        return
      }

      const ids = pedidos.map(p => p.id)

      const [
        { count: totalItens },
        { count: totalATs },
        { count: totalOcorrencias },
        { count: totalEntregas },
        { count: totalHist1 },
        { count: totalHist2 },
      ] = await Promise.all([
        supabase.from('itens_pedido').select('id', { count: 'exact', head: true }).in('pedido_id', ids),
        supabase.from('assistencias_tecnicas').select('id', { count: 'exact', head: true }).in('pedido_id', ids),
        supabase.from('ocorrencias').select('id', { count: 'exact', head: true }).in('pedido_id', ids),
        supabase.from('entregas').select('id', { count: 'exact', head: true }).in('pedido_id', ids),
        supabase.from('historico_alteracoes').select('id', { count: 'exact', head: true }).in('pedido_id', ids),
        supabase.from('historico_itens').select('id', { count: 'exact', head: true }).in('pedido_id', ids),
      ])

      setResumo({
        pedidosIds: ids,
        totalPedidos: ids.length,
        totalItens: totalItens || 0,
        totalATs: totalATs || 0,
        totalOcorrencias: totalOcorrencias || 0,
        totalEntregas: totalEntregas || 0,
        totalHistorico: (totalHist1 || 0) + (totalHist2 || 0),
      })
    } catch (e: any) {
      alert('Erro ao buscar dados: ' + e.message)
    } finally {
      setBuscando(false)
    }
  }

  async function executarLimpeza() {
    if (!resumo || resumo.pedidosIds.length === 0) return
    setExcluindo(true)
    try {
      const ids = resumo.pedidosIds
      // Ordem: histórico → filhos → pedidos
      await supabase.from('historico_itens').delete().in('pedido_id', ids)
      await supabase.from('historico_alteracoes').delete().in('pedido_id', ids)
      await supabase.from('itens_pedido').delete().in('pedido_id', ids)
      await supabase.from('assistencias_tecnicas').delete().in('pedido_id', ids)
      await supabase.from('ocorrencias').delete().in('pedido_id', ids)
      await supabase.from('entregas').delete().in('pedido_id', ids)
      await supabase.from('pedidos').delete().in('id', ids)
      setConcluido(true)
      setResumo(null)
      setConfirmacao('')
    } catch (e: any) {
      alert('Erro ao excluir dados: ' + e.message)
    } finally {
      setExcluindo(false)
    }
  }

  const podeExcluir = confirmacao === 'CONFIRMAR' && resumo && resumo.totalPedidos > 0

  return (
    <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid #e8e7e3', overflow: 'hidden', marginTop: '20px' }}>
      <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #f0efe9', background: '#f7f6f3' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Limpeza de dados</div>
        <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>Remove pedidos entregues/cancelados de um ano para liberar espaço</div>
      </div>
      <div style={{ padding: '20px' }}>

        {concluido && (
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#e8f5e2', color: '#2d6a0e', fontSize: '13px', fontWeight: '500', marginBottom: '16px' }}>
            ✓ Limpeza concluída com sucesso. O espaço foi liberado no banco de dados.
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', color: '#555' }}>Excluir registros do ano:</div>
          <select
            value={anoSelecionado}
            onChange={e => { setAnoSelecionado(Number(e.target.value)); setResumo(null); setConfirmacao(''); setConcluido(false) }}
            style={{ padding: '7px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', background: '#f7f6f3', color: '#1a1a2e' }}
          >
            {anos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button
            onClick={buscarResumo}
            disabled={buscando}
            style={{ padding: '7px 16px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#f7f6f3', color: '#555', fontSize: '13px', fontWeight: '500', cursor: buscando ? 'not-allowed' : 'pointer', opacity: buscando ? 0.7 : 1 }}
          >
            {buscando ? 'Buscando...' : 'Ver o que será excluído'}
          </button>
        </div>

        {resumo && resumo.totalPedidos === 0 && (
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#f7f6f3', border: '0.5px solid #e8e7e3', fontSize: '13px', color: '#888' }}>
            Nenhum pedido entregue ou cancelado encontrado em {anoSelecionado}.
          </div>
        )}

        {resumo && resumo.totalPedidos > 0 && (
          <div style={{ border: '0.5px solid #e8e7e3', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: '#fff8e1', borderBottom: '0.5px solid #f0d88a', fontSize: '12px', fontWeight: '600', color: '#7a5800' }}>
              ⚠️ Resumo do que será excluído permanentemente — ano {anoSelecionado}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
              {[
                { label: 'Pedidos', valor: resumo.totalPedidos },
                { label: 'Itens', valor: resumo.totalItens },
                { label: 'Assistências técnicas', valor: resumo.totalATs },
                { label: 'Ocorrências', valor: resumo.totalOcorrencias },
                { label: 'Entregas', valor: resumo.totalEntregas },
                { label: 'Registros de histórico', valor: resumo.totalHistorico },
              ].map((item, i) => (
                <div key={i} style={{ padding: '10px 16px', borderBottom: i < 4 ? '0.5px solid #f0efe9' : 'none', borderRight: i % 2 === 0 ? '0.5px solid #f0efe9' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#555' }}>{item.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#A32D2D' }}>{item.valor.toLocaleString('pt-BR')}</span>
                </div>
              ))}
            </div>

            <div style={{ padding: '16px', borderTop: '0.5px solid #e8e7e3', background: '#fafaf8' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                Para confirmar, digite <strong style={{ color: '#1a1a2e', letterSpacing: '0.5px' }}>CONFIRMAR</strong> no campo abaixo:
              </div>
              <input
                type="text"
                value={confirmacao}
                onChange={e => setConfirmacao(e.target.value)}
                placeholder="Digite CONFIRMAR para liberar o botão"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `0.5px solid ${podeExcluir ? '#A32D2D' : '#e8e7e3'}`, fontSize: '13px', outline: 'none', boxSizing: 'border-box', marginBottom: '12px', transition: 'border-color 0.2s' }}
              />
              <button
                onClick={executarLimpeza}
                disabled={!podeExcluir || excluindo}
                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: podeExcluir ? '#A32D2D' : '#e8e7e3', color: podeExcluir ? '#fff' : '#aaa', fontSize: '13px', fontWeight: '500', cursor: podeExcluir && !excluindo ? 'pointer' : 'not-allowed', transition: 'background 0.2s' }}
              >
                {excluindo ? 'Excluindo...' : `🗑 Excluir ${resumo.totalPedidos} pedidos e todos os registros vinculados`}
              </button>
            </div>
          </div>
        )}

        <div style={{ marginTop: '14px', fontSize: '12px', color: '#aaa', lineHeight: '1.6' }}>
          Recomendado: exporte o backup antes de executar a limpeza. Apenas pedidos com status <strong>entregue</strong> ou <strong>cancelado</strong> são removidos.
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function Configuracoes() {
  const [enderecoSaida, setEnderecoSaida] = useState('')
  const [nomeSaida, setNomeSaida] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [dbSize, setDbSize] = useState<{ mb: number; pct: number } | null>(null)
  const [exportando, setExportando] = useState(false)
  const [visualizadorAberto, setVisualizadorAberto] = useState(false)

  useEffect(() => {
    carregar()
    buscarDbSize()
  }, [])

  async function exportarBackup() {
    setExportando(true)
    try {
      const [
        { data: pedidos },
        { data: itens },
        { data: clientes },
        { data: fornecedores },
        { data: profissionais },
        { data: ats },
        { data: ocorrencias },
        { data: entregas },
      ] = await Promise.all([
        supabase.from('pedidos').select('*').range(0, 9999),
        supabase.from('itens_pedido').select('*').range(0, 9999),
        supabase.from('clientes').select('*').range(0, 9999),
        supabase.from('fornecedores').select('*').range(0, 9999),
        supabase.from('profissionais').select('*').range(0, 9999),
        supabase.from('assistencias_tecnicas').select('*').range(0, 9999),
        supabase.from('ocorrencias').select('*').range(0, 9999),
        supabase.from('entregas').select('*').range(0, 9999),
      ])
      const backup = {
        exportadoEm: new Date().toISOString(),
        versao: '1.0',
        dados: { pedidos, itens, clientes, fornecedores, profissionais, ats, ocorrencias, entregas },
      }
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const hoje = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `backup-operahouse-${hoje}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      alert('Erro ao exportar backup: ' + e.message)
    } finally {
      setExportando(false)
    }
  }

  async function buscarDbSize() {
    try {
      const res = await fetch('/api/db-size')
      if (!res.ok) return
      const { bytes } = await res.json()
      if (!bytes) return
      const mb = bytes / (1024 * 1024)
      setDbSize({ mb, pct: (mb / 500) * 100 })
    } catch {}
  }

  async function carregar() {
    const { data } = await supabase
      .from('configuracoes')
      .select('chave, valor')
      .in('chave', ['endereco_saida', 'nome_saida'])
    if (!data) return
    const map = Object.fromEntries(data.map(r => [r.chave, r.valor || '']))
    setEnderecoSaida(map['endereco_saida'] || '')
    setNomeSaida(map['nome_saida'] || '')
  }

  async function salvar() {
    setSalvando(true)
    const registros = [
      { chave: 'endereco_saida', valor: enderecoSaida.trim() },
      { chave: 'nome_saida', valor: nomeSaida.trim() },
    ]
    for (const r of registros) {
      const { data: existente } = await supabase.from('configuracoes').select('chave').eq('chave', r.chave).maybeSingle()
      const { error } = existente
        ? await supabase.from('configuracoes').update({ valor: r.valor }).eq('chave', r.chave)
        : await supabase.from('configuracoes').insert({ chave: r.chave, valor: r.valor })
      if (error) {
        setSalvando(false)
        alert('Erro ao salvar ' + r.chave + ': ' + error.message)
        return
      }
    }
    setSalvando(false)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2500)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#f7f6f3' }}>
      <Sidebar ativa="/configuracoes" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: '52px', background: '#fff', borderBottom: '0.5px solid #e8e7e3', display: 'flex', alignItems: 'center', padding: '0 22px', fontSize: '15px', fontWeight: '500', color: '#1a1a2e', flexShrink: 0 }}>
          Configurações
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '28px 24px' }}>
          <div style={{ maxWidth: '560px' }}>

            {/* Endereço de saída */}
            <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #f0efe9', background: '#f7f6f3' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Endereço de saída padrão</div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>Ponto de partida inserido automaticamente na rota do Google Maps</div>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Nome do local (ex: Loja Opera House)</div>
                  <input value={nomeSaida} onChange={e => setNomeSaida(e.target.value)} placeholder="Ex: Showroom Opera House" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Endereço completo</div>
                  <input value={enderecoSaida} onChange={e => setEnderecoSaida(e.target.value)} placeholder="Ex: Rua das Flores, 123, Vila Nova, São Paulo, SP" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '18px' }}>Cole o endereço completo com rua, número, bairro, cidade e estado.</div>
                <button onClick={salvar} disabled={salvando} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: salvo ? '#3B6D11' : '#1a1a2e', color: salvo ? '#fff' : '#C9A84C', fontSize: '13px', fontWeight: '500', cursor: 'pointer', transition: 'background 0.2s' }}>
                  {salvo ? '✓ Salvo' : salvando ? 'Salvando...' : 'Salvar configurações'}
                </button>
              </div>
            </div>

            {/* Banco de dados */}
            <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid #e8e7e3', overflow: 'hidden', marginTop: '20px' }}>
              <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #f0efe9', background: '#f7f6f3' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Banco de dados</div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>Uso do plano gratuito Supabase (limite: 500 MB)</div>
              </div>
              <div style={{ padding: '20px' }}>
                {dbSize ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                      <div style={{ flex: 1, height: '8px', background: '#f0efe9', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(dbSize.pct, 100)}%`, borderRadius: '99px', background: dbSize.pct >= 90 ? '#A32D2D' : dbSize.pct >= 70 ? '#BA7517' : '#3B6D11', transition: 'width 0.5s' }} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: dbSize.pct >= 90 ? '#A32D2D' : dbSize.pct >= 70 ? '#BA7517' : '#3B6D11', whiteSpace: 'nowrap' }}>{dbSize.pct.toFixed(1)}%</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{dbSize.mb.toFixed(1)} MB utilizados de 500 MB</div>
                    {dbSize.pct >= 70 && (
                      <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '8px', background: dbSize.pct >= 90 ? '#FCEBEB' : '#FFF3CD', fontSize: '12px', color: dbSize.pct >= 90 ? '#791F1F' : '#7A5800' }}>
                        {dbSize.pct >= 90 ? '⚠️ Banco próximo do limite. Considere limpar dados ou migrar para o plano pago.' : '⚠️ Uso elevado. Fique atento ao limite.'}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: '13px', color: '#aaa' }}>Carregando...</div>
                )}
              </div>
            </div>

            {/* Limpeza de dados */}
            <LimpezaCard />

            {/* Backup de dados */}
            <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid #e8e7e3', overflow: 'hidden', marginTop: '20px' }}>
              <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #f0efe9', background: '#f7f6f3' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Backup de dados</div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>Exporta e visualiza todos os dados do sistema</div>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ fontSize: '13px', color: '#555', marginBottom: '16px' }}>
                  O arquivo inclui pedidos, itens, clientes, fornecedores, profissionais, assistências técnicas, ocorrências e entregas.
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={exportarBackup} disabled={exportando} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#1a1a2e', color: '#C9A84C', fontSize: '13px', fontWeight: '500', cursor: exportando ? 'not-allowed' : 'pointer', opacity: exportando ? 0.7 : 1 }}>
                    {exportando ? 'Exportando...' : '⬇ Exportar backup'}
                  </button>
                  <button onClick={() => setVisualizadorAberto(true)} style={{ padding: '8px 20px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#f7f6f3', color: '#555', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                    📂 Visualizar backup
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {visualizadorAberto && (
        <VisualizadorBackup onFechar={() => setVisualizadorAberto(false)} />
      )}
    </div>
  )
}
