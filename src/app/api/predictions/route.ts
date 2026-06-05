import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { mapMatch, mapPrediction } from '@/lib/db/mappers'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { matchId, predType, predHome, predAway } = body

  if (!matchId || !predType) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const { data: matchData } = await supabaseAdmin.from('matches').select('*').eq('id', matchId).maybeSingle()
  if (!matchData) return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 })
  const match = mapMatch(matchData)
  if (match.status !== 'scheduled') return NextResponse.json({ error: 'Predicciones cerradas' }, { status: 403 })

  if (predType === 'exact_score') {
    if (predHome == null || predAway == null || predHome < 0 || predAway < 0) {
      return NextResponse.json({ error: 'Marcador inválido' }, { status: 400 })
    }
  }

  const { data, error } = await supabaseAdmin
    .from('predictions')
    .upsert(
      {
        user_id: user.id,
        match_id: matchId,
        pred_type: predType,
        pred_home: predType === 'exact_score' ? predHome : null,
        pred_away: predType === 'exact_score' ? predAway : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,match_id' }
    )
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ prediction: mapPrediction(data) })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const matchId = searchParams.get('matchId')
  if (!matchId) return NextResponse.json({ error: 'Falta matchId' }, { status: 400 })

  const { data: matchData } = await supabaseAdmin.from('matches').select('status').eq('id', matchId).maybeSingle()
  if (matchData?.status !== 'scheduled') return NextResponse.json({ error: 'Predicciones cerradas' }, { status: 403 })

  await supabaseAdmin
    .from('predictions')
    .delete()
    .eq('user_id', user.id)
    .eq('match_id', matchId)

  return NextResponse.json({ ok: true })
}
