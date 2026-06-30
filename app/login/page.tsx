'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function entrar() {
    if (!email || !senha) return setErro('Preencha e-mail e senha')
    setLoading(true)
    setErro('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      setErro('E-mail ou senha incorretos')
      setLoading(false)
      return
    }
    window.location.href = '/pedidos'
  }

  return (
    <div style={{ height: '100vh', display: 'flex', fontFamily: 'sans-serif', background: '#f7f6f3' }}>
      <div style={{ width: '420px', background: '#1a1a2e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
        <div style={{ fontSize: '28px', fontWeight: '500', color: '#fff', marginBottom: '8px' }}>
          Opera <span style={{ color: '#C9A84C' }}>House</span>
        </div>
        <div style={{ fontSize: '13px', color: '#6a6a8a', marginBottom: '48px' }}>Sistema de gestão de pedidos</div>

        <div style={{ width: '100%' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: '#6a6a8a', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>E-mail</div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && entrar()}
              placeholder="seu@email.com"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '0.5px solid #2d2d44', background: '#252540', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', color: '#6a6a8a', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Senha</div>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && entrar()}
              placeholder="••••••••"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '0.5px solid #2d2d44', background: '#252540', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {erro && (
            <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#3a1a1a', borderRadius: '8px', fontSize: '13px', color: '#e87878' }}>
              {erro}
            </div>
          )}

          <button
            onClick={entrar}
            disabled={loading}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: '#C9A84C', color: '#1a1a2e', fontSize: '14px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '32px', color: '#e8e7e3' }}>🏛️</div>
        <div style={{ fontSize: '15px', color: '#aaa', fontWeight: '500' }}>Delinear Móveis</div>
        <div style={{ fontSize: '12px', color: '#ccc' }}>Opera House — Gestão interna</div>
      </div>
    </div>
  )
}
