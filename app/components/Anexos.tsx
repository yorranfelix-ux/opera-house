'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

interface Anexo {
  id: string
  created_at: string
  nome_arquivo: string
  tamanho: number | null
  tipo_mime: string | null
  storage_path: string
  usuario_nome: string | null
}

interface AnexosProps {
  pedidoId?: string
  atId?: string
  titulo?: string
}

function formatarTamanho(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Anexos({ pedidoId, atId, titulo = 'Anexos' }: AnexosProps) {
  const [anexos, setAnexos] = useState<Anexo[]>([])
  const [enviando, setEnviando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { buscarAnexos() }, [pedidoId, atId])

  async function buscarAnexos() {
    let q = supabase.from('anexos').select('*').order('created_at', { ascending: false })
    if (pedidoId) q = q.eq('pedido_id', pedidoId)
    else if (atId) q = q.eq('at_id', atId)
    const { data } = await q
    setAnexos((data as Anexo[]) || [])
  }

  async function enviarArquivo(file: File) {
    setEnviando(true)
    try {
      const ts = Date.now()
      const nomeLimpo = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const pasta = pedidoId ? `pedidos/${pedidoId}` : `ats/${atId}`
      const path = `${pasta}/${ts}_${nomeLimpo}`

      const { error: uploadError } = await supabase.storage.from('anexos').upload(path, file)
      if (uploadError) { alert('Erro no upload: ' + uploadError.message); return }

      const { data: { user } } = await supabase.auth.getUser()
      const { data: perfil } = await supabase.from('profiles').select('nome').eq('id', user?.id || '').single()

      await supabase.from('anexos').insert([{
        pedido_id: pedidoId || null,
        at_id: atId || null,
        nome_arquivo: file.name,
        tamanho: file.size,
        tipo_mime: file.type || null,
        storage_path: path,
        usuario_nome: perfil?.nome || user?.email || null,
      }])
      buscarAnexos()
    } finally {
      setEnviando(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function excluirAnexo(anexo: Anexo) {
    if (!confirm(`Excluir "${anexo.nome_arquivo}"?`)) return
    await supabase.storage.from('anexos').remove([anexo.storage_path])
    await supabase.from('anexos').delete().eq('id', anexo.id)
    buscarAnexos()
  }

  function abrirArquivo(storagePath: string) {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/anexos/${storagePath}`
    window.open(url, '_blank')
  }

  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #f0efe9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{titulo}</span>
        <button onClick={() => inputRef.current?.click()} disabled={enviando}
          style={{ padding: '5px 12px', borderRadius: '7px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#555', opacity: enviando ? 0.6 : 1 }}>
          {enviando ? 'Enviando...' : '+ Anexar arquivo'}
        </button>
        <input ref={inputRef} type="file" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) enviarArquivo(f) }} />
      </div>

      {anexos.length === 0 ? (
        <div style={{ padding: '24px 16px', textAlign: 'center', color: '#bbb', fontSize: '12px' }}>
          Nenhum arquivo anexado.
        </div>
      ) : (
        anexos.map((a, i) => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderTop: i > 0 ? '0.5px solid #f9f8f5' : 'none' }}>
            {/* Ícone */}
            <div style={{ width: '32px', height: '32px', borderRadius: '7px', background: '#f7f6f3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round">
                <rect x="2" y="1" width="10" height="12" rx="1.5"/>
                <line x1="4.5" y1="4.5" x2="9.5" y2="4.5"/>
                <line x1="4.5" y1="7" x2="9.5" y2="7"/>
                <line x1="4.5" y1="9.5" x2="7" y2="9.5"/>
              </svg>
            </div>
            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: '500', color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nome_arquivo}</div>
              <div style={{ fontSize: '10px', color: '#aaa' }}>
                {formatarTamanho(a.tamanho)}{a.usuario_nome ? ` · ${a.usuario_nome}` : ''} · {new Date(a.created_at).toLocaleDateString('pt-BR')}
              </div>
            </div>
            {/* Ações */}
            <button onClick={() => abrirArquivo(a.storage_path)} title="Abrir arquivo"
              style={{ padding: '4px 8px', borderRadius: '5px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '11px', cursor: 'pointer', color: '#555', flexShrink: 0 }}>
              ↗
            </button>
            <button onClick={() => excluirAnexo(a)} title="Excluir"
              style={{ padding: '4px 8px', borderRadius: '5px', border: '0.5px solid #FCEBEB', background: '#FCEBEB', fontSize: '11px', cursor: 'pointer', color: '#A32D2D', flexShrink: 0 }}>
              ✕
            </button>
          </div>
        ))
      )}
    </div>
  )
}
