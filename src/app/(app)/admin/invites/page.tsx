import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { mapUser, mapInviteToken } from '@/lib/db/mappers'
import { redirect } from 'next/navigation'
import { InvitesAdmin } from './invites-admin'

export default async function AdminInvitesPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: userData } = await supabaseAdmin.from('users').select('*').eq('id', authUser.id).maybeSingle()
  const dbUser = userData ? mapUser(userData) : null
  if (dbUser?.role !== 'admin') redirect('/dashboard')

  const { data: rawTokens } = await supabaseAdmin
    .from('invite_tokens')
    .select('*')
    .eq('created_by', authUser.id)

  const tokens = (rawTokens ?? []).map(mapInviteToken)

  return (
    <div className="p-6 max-w-[800px] mx-auto">
      <h1 className="text-xl font-bold mb-6">Invitaciones</h1>
      <InvitesAdmin initialTokens={tokens} />
    </div>
  )
}
