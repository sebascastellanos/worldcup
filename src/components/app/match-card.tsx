'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PredictionForm } from './prediction-form'
import { ScoreBadge } from './score-badge'
import type { Match, Prediction } from '@/lib/db/schema'

function TeamFlag({ flag, name }: { flag: string | null; name: string }) {
  if (!flag) return null
  if (flag.startsWith('http') || flag.startsWith('/')) {
    return (
      <img
        src={flag}
        alt={name}
        className="w-7 h-5 object-contain shrink-0"
        onError={(e) => { e.currentTarget.style.display = 'none' }}
      />
    )
  }
  return <span className="text-xl leading-none shrink-0">{flag}</span>
}

interface MatchCardProps {
  match: Match
  prediction?: Prediction | null
  onPredChange?: (matchId: string, pred: Prediction | null) => void
}

export function MatchCard({ match, prediction, onPredChange }: MatchCardProps) {
  const cutoff = new Date(new Date(match.matchDate).getTime() - 5 * 60 * 1000)
  const isLocked = match.status !== 'scheduled' || new Date() >= cutoff
  const hasResult = match.status === 'finished' && match.homeScore !== null

  return (
    <Card className="bg-white/75 backdrop-blur-sm border-white/60 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 space-y-3">
        {/* Header: date */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{format(new Date(match.matchDate), "dd 'de' MMM · HH:mm", { locale: es })}</span>
          {match.status === 'live' && (
            <Badge variant="outline" className="text-yellow-400 border-yellow-400 animate-pulse text-xs">EN VIVO</Badge>
          )}
        </div>

        {/* Teams row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
            <span className="font-bold text-base text-right truncate">{match.homeTeam}</span>
            <TeamFlag flag={match.homeFlag} name={match.homeTeam} />
          </div>

          {hasResult ? (
            <div className="font-mono font-black text-xl text-foreground px-3 shrink-0">
              {match.homeScore} – {match.awayScore}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm font-semibold px-3 shrink-0">vs</div>
          )}

          <div className="flex-1 flex items-center gap-2 min-w-0">
            <TeamFlag flag={match.awayFlag} name={match.awayTeam} />
            <span className="font-bold text-base truncate">{match.awayTeam}</span>
          </div>
        </div>

        {/* Prediction info */}
        {prediction && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {prediction.predType === 'exact_score'
                ? `Apostaste: ${prediction.predHome}–${prediction.predAway}`
                : prediction.predType === 'home_win' ? `Apostaste: gana ${match.homeTeam}`
                : prediction.predType === 'away_win' ? `Apostaste: gana ${match.awayTeam}`
                : 'Apostaste: empate'}
            </span>
            {match.status === 'finished' && (
              <ScoreBadge points={prediction.pointsEarned} status="finished" />
            )}
          </div>
        )}
        {!prediction && match.status === 'scheduled' && (
          <span className="text-xs text-muted-foreground italic">Sin predicción</span>
        )}

        {/* Prediction form */}
        <PredictionForm
          matchId={match.id}
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
          currentPred={prediction}
          locked={isLocked}
          onPredChange={onPredChange}
        />
      </CardContent>
    </Card>
  )
}
