import { supabaseAdmin } from '@/lib/supabase/admin'
import { mapPrediction } from '@/lib/db/mappers'
import { calcularPuntos } from './calculator'

export async function recalcularPuntosPartido(
  matchId: string,
  result: { homeScore: number; awayScore: number }
): Promise<number> {
  const { data: rawPreds } = await supabaseAdmin
    .from('predictions')
    .select('*')
    .eq('match_id', matchId)

  const matchPredictions = (rawPreds ?? []).map(mapPrediction)

  for (const pred of matchPredictions) {
    const points = calcularPuntos(
      { predType: pred.predType, predHome: pred.predHome, predAway: pred.predAway },
      result
    )

    await supabaseAdmin
      .from('predictions')
      .update({ points_earned: points, updated_at: new Date().toISOString() })
      .eq('id', pred.id)

    // Recalculate user total from DB to avoid drift
    const { data: userPreds } = await supabaseAdmin
      .from('predictions')
      .select('points_earned')
      .eq('user_id', pred.userId)

    const totalPoints = (userPreds ?? []).reduce((sum, p) => sum + (p.points_earned ?? 0), 0)

    await supabaseAdmin
      .from('users')
      .update({ total_points: totalPoints })
      .eq('id', pred.userId)
  }

  return matchPredictions.length
}
