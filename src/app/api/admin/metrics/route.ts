import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabaseAdmin.from('users').select('role').eq('id', user.id).maybeSingle()
  if (data?.role !== 'admin') return null
  return user
}

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [{ data: matchRows }, { data: userRows }, { data: predRows }] = await Promise.all([
    supabaseAdmin
      .from('matches')
      .select('id, home_team, away_team, stage, match_date')
      .eq('status', 'finished')
      .order('match_date', { ascending: true }),
    supabaseAdmin
      .from('users')
      .select('id, name')
      .order('total_points', { ascending: false }),
    supabaseAdmin
      .from('predictions')
      .select('user_id, match_id, points_earned'),
  ])

  const matches = matchRows ?? []
  const users = userRows ?? []
  const preds = predRows ?? []

  const matchIndexMap = new Map(matches.map((m, i) => [m.id, i]))

  const userPointsMap = new Map<string, number[]>()
  for (const user of users) {
    userPointsMap.set(user.id, new Array(matches.length).fill(0))
  }
  for (const pred of preds) {
    const idx = matchIndexMap.get(pred.match_id)
    if (idx === undefined) continue
    const arr = userPointsMap.get(pred.user_id)
    if (!arr) continue
    arr[idx] = pred.points_earned ?? 0
  }

  const usersData = users.map(user => {
    const points = userPointsMap.get(user.id) ?? []
    let sum = 0
    const series = points.map(pts => { sum += pts; return sum })
    return { id: user.id, name: user.name, series }
  })

  return NextResponse.json({
    matches: matches.map(m => ({ id: m.id, label: `${m.home_team} vs ${m.away_team}`, stage: m.stage })),
    users: usersData,
  })
}
