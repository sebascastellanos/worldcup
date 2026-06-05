import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { mapUser } from '@/lib/db/mappers'

async function requireAdmin(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabaseAdmin.from('users').select('*').eq('id', user.id).maybeSingle()
  const dbUser = data ? mapUser(data) : null
  if (dbUser?.role !== 'admin') return null
  return user
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
  if (userId === admin.id) return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 })

  await supabaseAdmin.from('predictions').delete().eq('user_id', userId)
  await supabaseAdmin.from('users').delete().eq('id', userId)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
