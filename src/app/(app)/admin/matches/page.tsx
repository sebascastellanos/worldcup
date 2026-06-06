import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { mapUser, mapMatch, mapSyncLog } from '@/lib/db/mappers'
import { redirect } from 'next/navigation'
import { MatchesAdmin } from './matches-admin'
import { SyncStatus } from '@/components/app/sync-status'

export default async function AdminMatchesPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: userData } = await supabaseAdmin.from('users').select('*').eq('id', authUser.id).maybeSingle()
  const dbUser = userData ? mapUser(userData) : null
  if (dbUser?.role !== 'admin') redirect('/dashboard')

  const [{ data: rawMatches }, { data: rawLogs }] = await Promise.all([
    supabaseAdmin.from('matches').select('*').order('match_date', { ascending: true }),
    supabaseAdmin.from('sync_logs').select('*').order('ran_at', { ascending: false }).limit(20),
  ])

  const allMatches = (rawMatches ?? []).map(mapMatch)
  const syncLogs = (rawLogs ?? []).map(mapSyncLog)

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-start justify-between gap-6">
        <h1 className="text-xl font-bold">Gestión de partidos</h1>
        <div className="w-80 shrink-0">
          <SyncStatus logs={syncLogs} />
        </div>
      </div>
      <MatchesAdmin initialMatches={allMatches} />
    </div>
  )
}
