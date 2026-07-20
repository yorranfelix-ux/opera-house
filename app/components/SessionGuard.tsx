'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function SessionGuard() {
  const pathname = usePathname()
  const [expirou, setExpirou] = useState(false)

  useEffect(() => {
    // Não atuar na página de login
    if (pathname === '/' || pathname === '/login') return

    let estavaLogado = false

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') estavaLogado = true
      if (event === 'SIGNED_OUT' && estavaLogado) setExpirou(true)
    })

    // Verificar sessão atual — só marcar expirado se havia sessão antes
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        estavaLogado = true
      }
      // Se não há sessão e não é a tela de login, é porque expirou durante o uso
      // Mas só mostramos o aviso se o usuário estava logado nesta sessão do navegador
    })

    return () => subscription.unsubscribe()
  }, [pathname])

  if (!expirou) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', padding: '36px 32px',
        maxWidth: '360px', width: '90%', textAlign: 'center',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
      }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a2e', marginBottom: '8px' }}>
          Sessão expirada
        </div>
        <div style={{ fontSize: '13px', color: '#666', marginBottom: '24px', lineHeight: '1.5' }}>
          Sua sessão expirou. Recarregue a página para continuar.
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 28px', borderRadius: '8px', border: 'none',
            background: '#1a1a2e', color: '#C9A84C',
            fontSize: '13px', fontWeight: '500', cursor: 'pointer',
          }}
        >
          Recarregar página
        </button>
      </div>
    </div>
  )
}
