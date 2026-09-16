'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { abrirBuscaGlobal } from './BuscaGlobal'

const ITENS = [
  {
    href: '/dashboard',
    label: 'Início',
    icon: (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/>
        <rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
      </svg>
    ),
  },
  {
    href: '/pedidos',
    label: 'Pedidos',
    icon: (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="1" width="12" height="14" rx="1.5"/>
        <line x1="5" y1="5" x2="11" y2="5"/><line x1="5" y1="8" x2="11" y2="8"/><line x1="5" y1="11" x2="8" y2="11"/>
      </svg>
    ),
  },
  {
    href: '/entregas',
    label: 'Entregas',
    icon: (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="5" width="10" height="8" rx="1"/>
        <path d="M11 7h2.5l1.5 3v3H11V7z"/>
        <circle cx="4" cy="14" r="1.5"/><circle cx="12.5" cy="14" r="1.5"/>
      </svg>
    ),
  },
  {
    href: '/assistencia',
    label: 'AT',
    icon: (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13.5 2.5a3 3 0 0 0-4.1 4.1L2.5 13.5l.5.5 6.9-6.9a3 3 0 0 0 4.1-4.1l-1.9 1.9-1.4-1.4 1.9-1.9z"/>
      </svg>
    ),
  },
  {
    href: '__busca__',
    label: 'Buscar',
    icon: (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="6" cy="6" r="4.5"/><line x1="9.5" y1="9.5" x2="14" y2="14"/>
      </svg>
    ),
  },
]

export default function MobileNav() {
  const ativa = usePathname() ?? ''
  const [alertCount, setAlertCount] = useState(0)

  useEffect(() => {
    async function contar() {
      const hoje = new Date().toISOString().split('T')[0]
      const tresAtras = new Date(Date.now() - 3 * 86400000).toISOString()
      const seteAtras = new Date(Date.now() - 7 * 86400000).toISOString()
      const [a, b, c] = await Promise.all([
        supabase.from('pedidos').select('id', { count: 'exact', head: true }).lt('prazo_prometido', hoje).not('status', 'in', '(entregue,cancelado)'),
        supabase.from('ocorrencias').select('id', { count: 'exact', head: true }).eq('status', 'aberta').lt('created_at', tresAtras),
        supabase.from('assistencias_tecnicas').select('id', { count: 'exact', head: true }).in('status', ['aberta', 'aguardando_retirada', 'em_reparo', 'enviado_fornecedor', 'aguardando_devolucao']).lt('updated_at', seteAtras),
      ])
      setAlertCount((a.count ?? 0) + (b.count ?? 0) + (c.count ?? 0))
    }
    contar()
  }, [])

  return (
    <nav style={{
      display: 'none',
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      background: '#1a1a2e',
      borderTop: '1px solid #242440',
      zIndex: 1000,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }} className="mobile-nav">
      <div style={{ display: 'flex', height: '60px' }}>
        {ITENS.map(item => {
          const active = item.href === ativa
          const isDashboard = item.href === '/dashboard'
          const isBusca = item.href === '__busca__'
          return (
            <button
              key={item.href}
              onClick={() => {
                if (isBusca) { abrirBuscaGlobal(); return }
                window.location.href = item.href
              }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                background: 'none',
                border: 'none',
                color: active ? '#C9A84C' : '#6a6a8a',
                cursor: 'pointer',
                position: 'relative',
                padding: '8px 0',
              }}
            >
              <span style={{ position: 'relative', display: 'flex' }}>
                {item.icon}
                {isDashboard && alertCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-4px', right: '-6px',
                    background: '#A32D2D', color: '#fff',
                    borderRadius: '10px', fontSize: '9px', fontWeight: '700',
                    minWidth: '14px', height: '14px', lineHeight: '14px',
                    textAlign: 'center', padding: '0 3px', fontFamily: 'sans-serif',
                  }}>
                    {alertCount > 99 ? '99+' : alertCount}
                  </span>
                )}
              </span>
              <span style={{ fontSize: '10px', fontFamily: 'sans-serif', fontWeight: active ? '600' : '400' }}>
                {item.label}
              </span>
              {active && (
                <span style={{
                  position: 'absolute', bottom: 0, left: '20%', right: '20%',
                  height: '2px', background: '#C9A84C', borderRadius: '2px 2px 0 0',
                }} />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
