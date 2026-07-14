import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key || !anonKey) {
    return NextResponse.json({ error: 'Variáveis de ambiente não configuradas no servidor' }, { status: 500 })
  }

  // Verifica se o chamador está autenticado
  const cookieStore = await cookies()
  const supabaseAuth = createServerClient(url, anonKey, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll() {},
    },
  })
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabaseAdmin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

  // Anula o usuario_id no histórico (preserva usuario_nome, remove a FK)
  await supabaseAdmin.from('historico_alteracoes').update({ usuario_id: null }).eq('usuario_id', userId)

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
  await supabaseAdmin.from('profiles').delete().eq('id', userId)

  return NextResponse.json({ ok: true })
}
