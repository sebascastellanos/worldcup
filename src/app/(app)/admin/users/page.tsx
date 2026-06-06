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

  const [{ data: rawUsers }, { count: totalMatches }, { data: predCounts }] = await Promise.all([
    supabaseAdmin.from('users').select('*').order('total_points', { ascending: false }),
    supabaseAdmin.from('matches').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('predictions').select('user_id'),
  ])

  const allUsers = (rawUsers ?? []).map(mapUser)

  const predCountMap = (predCounts ?? []).reduce<Record<string, number>>((acc, p) => {
    acc[p.user_id] = (acc[p.user_id] ?? 0) + 1
    return acc
  }, {})

  return (
    <UsersAdmin
      initialUsers={allUsers}
      currentUserId={authUser.id}
      totalMatches={totalMatches ?? 0}
      predCountMap={predCountMap}
    />
  )
}
