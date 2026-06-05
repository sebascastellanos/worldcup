import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { mapUser } from '@/lib/db/mappers'
import { redirect } from 'next/navigation'
import { UsersAdmin } from './users-admin'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: userData } = await supabaseAdmin.from('users').select('*').eq('id', authUser.id).maybeSingle()
  const dbUser = userData ? mapUser(userData) : null
  if (dbUser?.role !== 'admin') redirect('/dashboard')

  const { data: rawUsers } = await supabaseAdmin
    .from('users')
    .select('*')
    .order('total_points', { ascending: false })

  const allUsers = (rawUsers ?? []).map(mapUser)

  return <UsersAdmin initialUsers={allUsers} currentUserId={authUser.id} />
}
