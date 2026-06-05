import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { mapUser, mapMatch } from '@/lib/db/mappers'
import { redirect } from 'next/navigation'
import { MatchesAdmin } from './matches-admin'

export default async function AdminMatchesPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: userData } = await supabaseAdmin.from('users').select('*').eq('id', authUser.id).maybeSingle()
  const dbUser = userData ? mapUser(userData) : null
  if (dbUser?.role !== 'admin') redirect('/dashboard')

  const { data: rawMatches } = await supabaseAdmin
    .from('matches')
    .select('*')
    .order('match_date', { ascending: true })

  const allMatches = (rawMatches ?? []).map(mapMatch)

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <h1 className="text-xl font-bold mb-6">Gestión de partidos</h1>
      <MatchesAdmin initialMatches={allMatches} />
    </div>
  )
}
