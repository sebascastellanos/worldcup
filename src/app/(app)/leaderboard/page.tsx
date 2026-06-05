import { supabaseAdmin } from '@/lib/supabase/admin'
import { mapUser } from '@/lib/db/mappers'
import { LeaderboardTable } from '@/components/app/leaderboard-table'

export default async function LeaderboardPage() {
  const { data } = await supabaseAdmin
    .from('users')
    .select('*')
    .order('total_points', { ascending: false })

  const allUsers = (data ?? []).map(mapUser)

  return (
    <div className="p-6 max-w-[900px] mx-auto">
      <h1 className="text-xl font-bold mb-6">Tabla de posiciones</h1>
      <LeaderboardTable initialUsers={allUsers} />
    </div>
  )
}
