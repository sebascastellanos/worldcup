import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { mapInviteToken } from '@/lib/db/mappers'

export async function POST(req: NextRequest) {
  const { name, email, password, token } = await req.json()

  if (!name || !email || !password || !token) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const { data: inviteData } = await supabaseAdmin
    .from('invite_tokens')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (!inviteData) return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 400 })
  const invite = mapInviteToken(inviteData)
  if (invite.usedBy || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? 'Error al crear usuario' }, { status: 400 })
  }

  await supabaseAdmin.from('users').insert({
    id: authData.user.id,
    email,
    name,
    role: 'participant',
  })

  await supabaseAdmin
    .from('invite_tokens')
    .update({ used_by: authData.user.id, used_at: new Date().toISOString() })
    .eq('token', token)

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) {
    return NextResponse.json({ error: 'Cuenta creada, inicia sesión manualmente' }, { status: 200 })
  }

  return NextResponse.json({ ok: true })
}
