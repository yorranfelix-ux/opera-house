'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { LOGO_NEG } from '../lib/logos'
import BuscaGlobal, { abrirBuscaGlobal } from './BuscaGlobal'

const ICON: Record<string, React.ReactElement> = {
  '/dashboard': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/>
      <rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
    </svg>
  ),
  '/pedidos': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="1" width="12" height="14" rx="1.5"/>
      <line x1="5" y1="5" x2="11" y2="5"/><line x1="5" y1="8" x2="11" y2="8"/><line x1="5" y1="11" x2="8" y2="11"/>
    </svg>
  ),
  '/clientes': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6"/>
    </svg>
  ),
  '/fornecedores': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="6" width="14" height="9" rx="1"/><path d="M1 6l2-5h10l2 5"/>
      <line x1="8" y1="6" x2="8" y2="15"/><line x1="1" y1="10" x2="15" y2="10"/>
    </svg>
  ),
  '/profissionais': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="5" r="2.5"/><path d="M1 14c0-2.761 2.239-5 5-5"/>
      <circle cx="12" cy="10" r="2.5"/><line x1="12" y1="7" x2="12" y2="8"/><line x1="12" y1="12" x2="12" y2="13"/>
      <line x1="9" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="15" y2="10"/>
    </svg>
  ),
  '/assistencia': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 1.5a4 4 0 0 1 0 5.657L4.828 12.83A2 2 0 1 1 2 10l5.657-5.657A4 4 0 0 1 10.5 1.5z"/>
      <circle cx="3.5" cy="12.5" r="0.75" fill="currentColor" stroke="none"/>
    </svg>
  ),
  '/ocorrencias': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5L1 14.5h14L8 1.5z"/>
      <line x1="8" y1="7" x2="8" y2="10"/><circle cx="8" cy="12.5" r="0.6" fill="currentColor" stroke="none"/>
    </svg>
  ),
  '/entregas': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="5" width="10" height="8" rx="1"/>
      <path d="M11 7h2.5l1.5 3v3H11V7z"/>
      <circle cx="4" cy="14" r="1.5"/><circle cx="12.5" cy="14" r="1.5"/>
    </svg>
  ),
  '/historico': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6.5"/>
      <polyline points="8,4 8,8 11,10"/>
    </svg>
  ),
  '/usuarios': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.5" cy="5" r="2.5"/><path d="M1 14c0-2.485 2.015-4.5 4.5-4.5"/>
      <circle cx="11" cy="5" r="2.5"/><path d="M8 14c0-2.485 2.015-4.5 4.5-4.5S17 11.515 17 14"/>
    </svg>
  ),
  '/configuracoes': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2.5"/>
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4"/>
    </svg>
  ),
}

const GROUPS = [
  {
    items: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Pedidos', href: '/pedidos' },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { label: 'Clientes', href: '/clientes' },
      { label: 'Fornecedores', href: '/fornecedores' },
      { label: 'Profissionais', href: '/profissionais' },
    ],
  },
  {
    label: 'Pós-venda',
    items: [
      { label: 'Assistência Técnica', href: '/assistencia' },
      { label: 'Ocorrências', href: '/ocorrencias' },
      { label: 'Entregas', href: '/entregas' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { label: 'Histórico', href: '/historico' },
      { label: 'Usuários', href: '/usuarios' },
      { label: 'Configurações', href: '/configuracoes' },
    ],
  },
]

export default function Sidebar({ ativa }: { ativa: string }) {
  const [collapsed, setCollapsed] = useState(false)
  const [usuario, setUsuario] = useState<{ nome: string; cargo: string } | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('nome, cargo').eq('id', user.id).single()
      if (data) setUsuario(data)
    }
    carregar()
  }, [])

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar_collapsed', String(next))
  }

  async function sair() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const w = collapsed ? '56px' : '210px'

  return (
    <div style={{
      width: w,
      minWidth: w,
      background: '#1a1a2e',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      transition: 'width 200ms ease, min-width 200ms ease',
      overflow: 'hidden',
    }}>

      {/* Logo / Toggle topo */}
      <div style={{
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '0' : '0 16px',
        flexShrink: 0,
        borderBottom: '1px solid #242440',
      }}>
        {collapsed ? (
          <button
            onClick={toggleCollapsed}
            title="Expandir menu"
            style={{
              width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #242440',
              background: 'transparent', color: '#6a6a8a', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'color 150ms, background 150ms',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'
              ;(e.currentTarget as HTMLElement).style.color = '#C9A84C'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLElement).style.color = '#6a6a8a'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="5,2 10,7 5,12"/>
            </svg>
          </button>
        ) : (
          <img src={LOGO_NEG} alt="Opera House" style={{ width: '110px', objectFit: 'contain' }} />
        )}
      </div>

      {/* Botão de busca */}
      <div style={{ padding: collapsed ? '8px 6px' : '8px 8px 4px' }}>
        <button
          onClick={abrirBuscaGlobal}
          title="Buscar (Ctrl+K)"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '8px',
            padding: collapsed ? '8px 0' : '7px 10px',
            borderRadius: '8px',
            border: '1px solid #242440',
            background: 'transparent',
            color: '#6a6a8a',
            cursor: 'pointer',
            transition: 'background 150ms, color 150ms',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'
            ;(e.currentTarget as HTMLElement).style.color = '#a0a0c0'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = '#6a6a8a'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <circle cx="6" cy="6" r="4"/><line x1="9.5" y1="9.5" x2="13" y2="13"/>
          </svg>
          {!collapsed && (
            <>
              <span style={{ flex: 1, fontSize: '12px', fontFamily: 'sans-serif', textAlign: 'left', color: '#4a4a6a' }}>Buscar...</span>
              <span style={{ fontSize: '10px', fontFamily: 'sans-serif', color: '#3a3a58', background: '#242440', borderRadius: '4px', padding: '1px 5px' }}>Ctrl+K</span>
            </>
          )}
        </button>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0', scrollbarWidth: 'thin', scrollbarColor: '#242440 #1a1a2e' } as React.CSSProperties}>
        {GROUPS.map((group, gi) => (
          <div key={gi} style={{ marginBottom: '4px' }}>
            {/* Group label */}
            {group.label && !collapsed && (
              <div style={{
                fontSize: '9px',
                fontWeight: '600',
                color: '#3a3a58',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                padding: '10px 16px 4px',
                fontFamily: 'sans-serif',
                whiteSpace: 'nowrap',
              }}>
                {group.label}
              </div>
            )}
            {group.label && collapsed && <div style={{ height: '10px' }} />}

            {group.items.map(item => {
              const active = item.href === ativa
              return (
                <a
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: collapsed ? '9px 0' : '8px 12px',
                    margin: '1px 6px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    background: active ? 'rgba(201,168,76,0.12)' : 'transparent',
                    color: active ? '#C9A84C' : '#6a6a8a',
                    transition: 'background 150ms, color 150ms',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
                      ;(e.currentTarget as HTMLElement).style.color = '#a0a0c0'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent'
                      ;(e.currentTarget as HTMLElement).style.color = '#6a6a8a'
                    }
                  }}
                >
                  <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    {ICON[item.href]}
                  </span>
                  {!collapsed && (
                    <span style={{
                      fontSize: '13px',
                      fontWeight: active ? '500' : '400',
                      fontFamily: 'sans-serif',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                    }}>
                      {item.label}
                    </span>
                  )}
                </a>
              )
            })}
          </div>
        ))}
      </div>

      {/* Toggle button — só aparece expandido */}
      {!collapsed && (
        <div style={{ padding: '6px', borderTop: '1px solid #242440' }}>
          <button
            onClick={toggleCollapsed}
            title="Recolher menu"
            style={{
              width: '100%',
              padding: '7px',
              borderRadius: '7px',
              border: 'none',
              background: 'transparent',
              color: '#3a3a58',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              transition: 'color 150ms',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#6a6a8a' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#3a3a58' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9,2 4,7 9,12"/>
            </svg>
          </button>
        </div>
      )}

      {/* User */}
      {!collapsed && (
        <div style={{ padding: '10px 14px 14px', borderTop: '1px solid #242440' }}>
          {usuario && (
            <>
              <div style={{ fontSize: '12px', fontWeight: '500', color: '#c8c8e0', marginBottom: '1px', fontFamily: 'sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{usuario.nome}</div>
              <div style={{ fontSize: '11px', color: '#3a3a58', marginBottom: '8px', fontFamily: 'sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{usuario.cargo}</div>
            </>
          )}
          <button onClick={sair} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #242440', background: 'transparent', color: '#3a3a58', fontSize: '12px', cursor: 'pointer', textAlign: 'left', fontFamily: 'sans-serif', transition: 'color 150ms' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#6a6a8a' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#3a3a58' }}>
            Sair
          </button>
        </div>
      )}

      {collapsed && (
        <div style={{ padding: '8px 6px 12px', borderTop: '1px solid #242440', display: 'flex', justifyContent: 'center' }}>
          <button onClick={sair} title="Sair" style={{ width: '36px', height: '36px', borderRadius: '7px', border: '1px solid #242440', background: 'transparent', color: '#3a3a58', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3"/>
              <polyline points="9,4 13,7 9,10"/><line x1="13" y1="7" x2="5" y2="7"/>
            </svg>
          </button>
        </div>
      )}
      <BuscaGlobal />
    </div>
  )
}
