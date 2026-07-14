import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return NextResponse.json({ error: 'Variáveis SUPABASE_URL ou SERVICE_ROLE_KEY não configuradas no servidor' }, { status: 500 })
  }

  // Chama a API REST diretamente para ter acesso ao texto real do erro
  const res = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${key}`,
      'apikey': key,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    let errorMsg = `HTTP ${res.status}`
    try { errorMsg = JSON.parse(text)?.message || text || errorMsg } catch { errorMsg = text || errorMsg }
    return NextResponse.json({ error: errorMsg }, { status: 400 })
  }

  // Limpa o profile manualmente
  const supabaseAdmin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  await supabaseAdmin.from('profiles').delete().eq('id', userId)

  return NextResponse.json({ ok: true })
}
