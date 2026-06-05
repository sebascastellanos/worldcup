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
  const isLocked = match.status !== 'scheduled'
  const hasResult = match.status === 'finished' && match.homeScore !== null

  return (
    <Card className="bg-card border-border">
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
            <span className="font-medium text-sm text-right truncate">{match.homeTeam}</span>
            <TeamFlag flag={match.homeFlag} name={match.homeTeam} />
          </div>

          {hasResult ? (
            <div className="font-mono font-bold text-lg text-foreground px-2 shrink-0">
              {match.homeScore} – {match.awayScore}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm font-medium px-2 shrink-0">vs</div>
          )}

          <div className="flex-1 flex items-center gap-2 min-w-0">
            <TeamFlag flag={match.awayFlag} name={match.awayTeam} />
            <span className="font-medium text-sm truncate">{match.awayTeam}</span>
          </div>
        </div>

        {/* Prediction info */}
        {prediction && match.status === 'finished' && (
          <ScoreBadge points={prediction.pointsEarned} status="finished" />
        )}
        {prediction && match.status === 'scheduled' && (
          <span className="text-xs text-muted-foreground">
            {prediction.predType === 'exact_score'
              ? `Marcador: ${prediction.predHome}–${prediction.predAway}`
              : prediction.predType === 'home_win' ? '→ Gana local'
              : prediction.predType === 'away_win' ? '→ Gana visitante'
              : '→ Empate'}
          </span>
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
