import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { mapUser, mapMatch } from '@/lib/db/mappers'
import { recalcularPuntosPartido } from '@/lib/points/updater'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabaseAdmin.from('users').select('*').eq('id', user.id).maybeSingle()
  const dbUser = data ? mapUser(data) : null
  return dbUser?.role === 'admin' ? dbUser : null
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { homeTeam, awayTeam, homeFlag, awayFlag, matchDate, stage, externalId } = body

  if (!homeTeam || !awayTeam || !matchDate || !stage) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('matches')
    .insert({
      home_team: homeTeam,
      away_team: awayTeam,
      home_flag: homeFlag ?? null,
      away_flag: awayFlag ?? null,
      match_date: new Date(matchDate).toISOString(),
      stage,
      external_id: externalId ?? null,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ match: mapMatch(data) })
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { matchId, homeScore, awayScore, status } = body

  if (!matchId) return NextResponse.json({ error: 'matchId requerido' }, { status: 400 })

  const isReset = status === 'scheduled'

  const { data, error } = await supabaseAdmin
    .from('matches')
    .update({
      home_score: isReset ? null : (homeScore ?? null),
      away_score: isReset ? null : (awayScore ?? null),
      status: status ?? 'scheduled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', matchId)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let pointsUpdated = 0

  if (isReset) {
    await supabaseAdmin.from('predictions').update({ locked: false, points_earned: 0 }).eq('match_id', matchId)
    const { data: affectedPreds } = await supabaseAdmin
      .from('predictions').select('user_id').eq('match_id', matchId)
    const userIds = [...new Set((affectedPreds ?? []).map(p => p.user_id))]
    for (const userId of userIds) {
      const { data: userPreds } = await supabaseAdmin
        .from('predictions').select('points_earned').eq('user_id', userId)
      const total = (userPreds ?? []).reduce((s, p) => s + (p.points_earned ?? 0), 0)
      await supabaseAdmin.from('users').update({ total_points: total }).eq('id', userId)
    }
  }

  if (status === 'finished' && homeScore !== null && awayScore !== null) {
    await supabaseAdmin.from('predictions').update({ locked: true }).eq('match_id', matchId)
    pointsUpdated = await recalcularPuntosPartido(matchId, { homeScore, awayScore })
  }

  if (status === 'live') {
    await supabaseAdmin.from('predictions').update({ locked: true }).eq('match_id', matchId)
  }

  return NextResponse.json({ match: mapMatch(data), pointsUpdated })
}
