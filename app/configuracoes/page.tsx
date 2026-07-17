'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

export default function Configuracoes() {
  const [enderecoSaida, setEnderecoSaida] = useState('')
  const [nomeSaida, setNomeSaida] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [dbSize, setDbSize] = useState<{ mb: number; pct: number } | null>(null)
  const [exportando, setExportando] = useState(false)

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

            <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #f0efe9', background: '#f7f6f3' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Endereço de saída padrão</div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>Ponto de partida inserido automaticamente na rota do Google Maps</div>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Nome do local (ex: Loja Opera House)</div>
                  <input
                    value={nomeSaida}
                    onChange={e => setNomeSaida(e.target.value)}
                    placeholder="Ex: Showroom Opera House"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Endereço completo</div>
                  <input
                    value={enderecoSaida}
                    onChange={e => setEnderecoSaida(e.target.value)}
                    placeholder="Ex: Rua das Flores, 123, Vila Nova, São Paulo, SP"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '18px' }}>
                  Cole o endereço completo com rua, número, bairro, cidade e estado.
                </div>
                <button
                  onClick={salvar}
                  disabled={salvando}
                  style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: salvo ? '#3B6D11' : '#1a1a2e', color: salvo ? '#fff' : '#C9A84C', fontSize: '13px', fontWeight: '500', cursor: 'pointer', transition: 'background 0.2s' }}
                >
                  {salvo ? '✓ Salvo' : salvando ? 'Salvando...' : 'Salvar configurações'}
                </button>
              </div>
            </div>

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
                        <div style={{
                          height: '100%',
                          width: `${Math.min(dbSize.pct, 100)}%`,
                          borderRadius: '99px',
                          background: dbSize.pct >= 90 ? '#A32D2D' : dbSize.pct >= 70 ? '#BA7517' : '#3B6D11',
                          transition: 'width 0.5s',
                        }} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: dbSize.pct >= 90 ? '#A32D2D' : dbSize.pct >= 70 ? '#BA7517' : '#3B6D11', whiteSpace: 'nowrap' }}>
                        {dbSize.pct.toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      {dbSize.mb.toFixed(1)} MB utilizados de 500 MB
                    </div>
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

            <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid #e8e7e3', overflow: 'hidden', marginTop: '20px' }}>
              <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #f0efe9', background: '#f7f6f3' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Backup de dados</div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>Exporta todos os dados do sistema em formato JSON</div>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ fontSize: '13px', color: '#555', marginBottom: '16px' }}>
                  O arquivo inclui pedidos, itens, clientes, fornecedores, profissionais, assistências técnicas, ocorrências e entregas.
                </div>
                <button
                  onClick={exportarBackup}
                  disabled={exportando}
                  style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#1a1a2e', color: '#C9A84C', fontSize: '13px', fontWeight: '500', cursor: exportando ? 'not-allowed' : 'pointer', opacity: exportando ? 0.7 : 1 }}
                >
                  {exportando ? 'Exportando...' : '⬇ Exportar backup completo'}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
