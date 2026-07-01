'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { LOGO_NEG } from '../lib/logos'

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Pedidos', href: '/pedidos' },
  { label: 'Clientes', href: '/clientes' },
  { label: 'Fornecedores', href: '/fornecedores' },
  { label: 'Assistência Técnica', href: '/assistencia' },
  { label: 'Ocorrências', href: '/ocorrencias' },
  { label: 'Entregas', href: '/entregas' },
  { label: 'Configurações', href: '/configuracoes' },
]

export default function Sidebar({ ativa }: { ativa: string }) {
  const [usuario, setUsuario] = useState<{ nome: string; cargo: string } | null>(null)

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('nome, cargo').eq('id', user.id).single()
      if (data) setUsuario(data)
    }
    carregar()
  }, [])

  async function sair() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div style={{ width: '200px', background: '#1a1a2e', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '20px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={LOGO_NEG} alt="Opera House" style={{ width: '120px', objectFit: 'contain' }} />
      </div>
      <div style={{ height: '0.5px', background: '#2d2d44', margin: '0 16px 12px' }} />

      <div style={{ flex: 1 }}>
        {navItems.map(item => (
          <a
            key={item.href}
            href={item.href}
            style={{
              display: 'block',
              padding: '9px 20px',
              fontSize: '13px',
              color: item.href === ativa ? '#C9A84C' : '#8888aa',
              textDecoration: 'none',
              margin: '0 8px',
              borderRadius: '8px',
              background: item.href === ativa ? '#C9A84C18' : 'transparent',
            }}
          >
            {item.label}
          </a>
        ))}
      </div>

      <div style={{ height: '0.5px', background: '#2d2d44', margin: '0 16px 12px' }} />
      <div style={{ padding: '12px 20px 20px' }}>
        {usuario && (
          <>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#fff', marginBottom: '2px' }}>{usuario.nome}</div>
            <div style={{ fontSize: '11px', color: '#6a6a8a', marginBottom: '10px' }}>{usuario.cargo}</div>
          </>
        )}
        <button
          onClick={sair}
          style={{ width: '100%', padding: '7px', borderRadius: '7px', border: '0.5px solid #2d2d44', background: 'transparent', color: '#6a6a8a', fontSize: '12px', cursor: 'pointer', textAlign: 'left' }}
        >
          Sair
        </button>
      </div>
    </div>
  )
}
