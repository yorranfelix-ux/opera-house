import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no servidor' }, { status: 500 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) {
      const msg = error.message || `${(error as any).name || 'AuthError'} status ${(error as any).status || '?'}`
      console.error('deleteUser error:', error.name, error.message, (error as any).status)
      return NextResponse.json({ error: msg }, { status: 400 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) || 'Erro inesperado' }, { status: 500 })
  }

  await supabaseAdmin.from('profiles').delete().eq('id', userId)

  return NextResponse.json({ ok: true })
}
