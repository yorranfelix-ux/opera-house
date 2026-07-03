'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

export default function Configuracoes() {
  const [enderecoSaida, setEnderecoSaida] = useState('')
  const [nomeSaida, setNomeSaida] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => { carregar() }, [])

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

    // Apaga os registros atuais e insere novos (evita dependência de constraint UNIQUE)
    for (const chave of ['endereco_saida', 'nome_saida']) {
      const { error: delErr } = await supabase.from('configuracoes').delete().eq('chave', chave)
      if (delErr && !delErr.message.includes('no rows')) {
        setSalvando(false)
        alert('Erro ao salvar (' + chave + '): ' + delErr.message)
        return
      }
    }

    const valor1 = enderecoSaida.trim()
    const valor2 = nomeSaida.trim()

    const inserts = [
      valor1 ? supabase.from('configuracoes').insert({ chave: 'endereco_saida', valor: valor1 }) : Promise.resolve({ error: null }),
      valor2 ? supabase.from('configuracoes').insert({ chave: 'nome_saida', valor: valor2 }) : Promise.resolve({ error: null }),
    ]

    const [r1, r2] = await Promise.all(inserts)
    setSalvando(false)

    const erro = (r1 as any).error || (r2 as any).error
    if (erro) {
      alert('Erro ao salvar: ' + erro.message)
      return
    }

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

            <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid #e8e7e3', overflow: 'hidden', marginBottom: '20px' }}>
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

          </div>
        </div>
      </div>
    </div>
  )
}
