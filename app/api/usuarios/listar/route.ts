import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, nome, cargo')
    .order('nome')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()

  const usuarios = profiles.map(p => {
    const authUser = authUsers?.users?.find(u => u.id === p.id)
    return { ...p, email: authUser?.email || '', created_at: authUser?.created_at || '' }
  })

  return NextResponse.json({ usuarios })
}
