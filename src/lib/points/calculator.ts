import type { PredType } from '@/lib/db/schema'

type Pred = { predType: PredType; predHome?: number | null; predAway?: number | null }
type Result = { homeScore: number; awayScore: number }

export function calcularPuntos(pred: Pred, result: Result): number {
  const realOutcome = Math.sign(result.homeScore - result.awayScore)

  if (pred.predType === 'exact_score') {
    if (pred.predHome === result.homeScore && pred.predAway === result.awayScore) return 3
    return 0
  }

  const outcomeMap: Record<Exclude<PredType, 'exact_score'>, number> = {
    home_win: 1,
    draw: 0,
    away_win: -1,
  }
  return outcomeMap[pred.predType as Exclude<PredType, 'exact_score'>] === realOutcome ? 1 : 0
}
