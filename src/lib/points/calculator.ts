import type { PredType } from '@/lib/db/schema'

type Pred = { predType: PredType; predHome?: number | null; predAway?: number | null }
// winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null — provided for knockout matches
type Result = { homeScore: number; awayScore: number; winner?: string | null }

export function calcularPuntos(pred: Pred, result: Result): number {
  if (pred.predType === 'exact_score') {
    if (pred.predHome === result.homeScore && pred.predAway === result.awayScore) return 5
    return 0
  }

  // Knockout: use API winner (accounts for extra time + penalties)
  if (result.winner) {
    if (pred.predType === 'home_win') return result.winner === 'HOME_TEAM' ? 1 : 0
    if (pred.predType === 'away_win') return result.winner === 'AWAY_TEAM' ? 1 : 0
    return 0 // draw predictions are invalid in knockout
  }

  // Group stage: compare fullTime scores
  const realOutcome = Math.sign(result.homeScore - result.awayScore)
  const outcomeMap: Record<Exclude<PredType, 'exact_score'>, number> = {
    home_win: 1, draw: 0, away_win: -1,
  }
  return outcomeMap[pred.predType as Exclude<PredType, 'exact_score'>] === realOutcome ? 1 : 0
}
