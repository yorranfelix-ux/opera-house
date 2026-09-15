'use client'

import { useEffect, useState } from 'react'

export default function PWAInstaller() {
  const [prompt, setPrompt] = useState<any>(null)
  const [mostrar, setMostrar] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error)
    }

    const handler = (e: any) => {
      e.preventDefault()
      setPrompt(e)
      setMostrar(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function instalar() {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setMostrar(false)
  }

  if (!mostrar) return null

  return (
    <div style={{
      position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
      background: '#1a1a2e', color: '#fff', borderRadius: '12px', padding: '14px 20px',
      display: 'flex', alignItems: 'center', gap: '14px', zIndex: 9999,
      boxShadow: '0 4px 20px rgba(0,0,0,0.25)', fontSize: '13px', whiteSpace: 'nowrap',
    }}>
      <span>📲 Instalar o Opera House no celular</span>
      <button
        onClick={instalar}
        style={{ background: '#C9A84C', color: '#1a1a2e', border: 'none', borderRadius: '8px', padding: '6px 16px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}
      >
        Instalar
      </button>
      <button
        onClick={() => setMostrar(false)}
        style={{ background: 'none', border: 'none', color: '#888', fontSize: '16px', cursor: 'pointer', padding: '0' }}
      >
        ✕
      </button>
    </div>
  )
}
