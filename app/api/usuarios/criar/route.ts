import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { email, senha, nome, cargo } = await req.json()

  if (!email || !senha || !nome) {
    return NextResponse.json({ error: 'Email, senha e nome são obrigatórios' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert([{ id: authData.user.id, nome, cargo: cargo || '' }])

  if (profileError) {
    return NextResponse.json({ error: 'Usuário criado mas erro ao salvar perfil: ' + profileError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
