'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function SessionGuard() {
  const [expirou, setExpirou] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        if (event === 'SIGNED_OUT') setExpirou(true)
      }
    })

    // Check if current session is already expired
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) setExpirou(true)
    })

    return () => subscription.unsubscribe()
  }, [])

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
