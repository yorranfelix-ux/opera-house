import { supabase } from './supabase'

export async function registrarHistorico({
  tipo,
  descricao,
  pedidoId,
  itemId,
}: {
  tipo: string
  descricao: string
  pedidoId?: string | null
  itemId?: string | null
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: profile } = await supabase.from('profiles').select('nome').eq('id', user.id).single()
  await supabase.from('historico_alteracoes').insert([{
    pedido_id: pedidoId || null,
    item_id: itemId || null,
    usuario_id: user.id,
    usuario_nome: profile?.nome || user.email,
    tipo,
    descricao,
  }])
}
