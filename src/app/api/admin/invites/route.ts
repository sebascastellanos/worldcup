import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { mapUser, mapInviteToken } from '@/lib/db/mappers'
import { addDays } from 'date-fns'
import { randomUUID } from 'crypto'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, admin: null }
  const { data } = await supabaseAdmin.from('users').select('*').eq('id', user.id).maybeSingle()
  const dbUser = data ? mapUser(data) : null
  return { user, admin: dbUser?.role === 'admin' ? dbUser : null }
}

export async function POST(req: NextRequest) {
  const { user, admin } = await requireAdmin()
  if (!admin || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const token = randomUUID()
  const { data, error } = await supabaseAdmin
    .from('invite_tokens')
    .insert({
      token,
      created_by: user.id,
      expires_at: addDays(new Date(), 7).toISOString(),
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ token: data.token })
}

export async function GET(req: NextRequest) {
  const { user, admin } = await requireAdmin()
  if (!admin || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data } = await supabaseAdmin
    .from('invite_tokens')
    .select('*')
    .eq('created_by', user.id)

  return NextResponse.json({ tokens: (data ?? []).map(mapInviteToken) })
}
