'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PredictionForm } from './prediction-form'
import { ScoreBadge } from './score-badge'
import type { Match, Prediction } from '@/lib/db/schema'
import type { PredType } from '@/lib/db/schema'

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

interface MatchPred {
  userName: string
  predType: PredType
  predHome: number | null
  predAway: number | null
  pointsEarned: number | null
}

function predLabel(pred: MatchPred, match: Match): string {
  if (pred.predType === 'exact_score') return `${pred.predHome}–${pred.predAway}`
  if (pred.predType === 'home_win') return `Gana ${match.homeTeam}`
  if (pred.predType === 'away_win') return `Gana ${match.awayTeam}`
  return 'Empate'
}

function MatchPredsModal({ match, open, onClose }: { match: Match; open: boolean; onClose: () => void }) {
  const [preds, setPreds] = useState<MatchPred[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  function handleOpen(isOpen: boolean) {
    if (isOpen && !loaded) {
      setLoading(true)
      fetch(`/api/matches/${match.id}/predictions`)
        .then(r => r.json())
        .then(data => { setPreds(data.predictions ?? []); setLoaded(true) })
        .finally(() => setLoading(false))
    }
    if (!isOpen) onClose()
  }

  // trigger load when opened
  if (open && !loaded && !loading) handleOpen(true)

  const hasResult = match.status === 'finished' && match.homeScore !== null

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">
            {match.homeTeam} vs {match.awayTeam}
            {hasResult && (
              <span className="ml-2 font-mono text-primary">{match.homeScore}–{match.awayScore}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Cargando...</p>
        ) : preds.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Nadie ha predicho este partido.</p>
        ) : (
          <div className="space-y-2">
            {preds.map((pred, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                <div>
                  <div className="text-sm font-medium">{pred.userName}</div>
                  <div className="text-xs text-primary font-medium">{predLabel(pred, match)}</div>
                </div>
                {hasResult && pred.pointsEarned !== null && (
                  <span className={[
                    'text-xs font-bold px-2 py-0.5 rounded-full',
                    pred.pointsEarned === 5 ? 'bg-violet-100 text-violet-700' :
                    pred.pointsEarned === 1 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-600',
                  ].join(' ')}>
                    {pred.pointsEarned} pts
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface MatchCardProps {
  match: Match
  prediction?: Prediction | null
  onPredChange?: (matchId: string, pred: Prediction | null) => void
  highlighted?: boolean
}

export function MatchCard({ match, prediction, onPredChange, highlighted }: MatchCardProps) {
  const cutoff = new Date(new Date(match.matchDate).getTime() - 5 * 60 * 1000)
  const isLocked = match.status !== 'scheduled' || new Date() >= cutoff
  const hasResult = match.status === 'finished' && match.homeScore !== null
  const [showPreds, setShowPreds] = useState(false)

  return (
    <>
      <Card
        id={`match-${match.id}`}
        className={[
          'bg-white/75 backdrop-blur-sm shadow-sm md:hover:shadow-md transition-all duration-500',
          highlighted
            ? 'border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/40'
            : 'border-white/60',
        ].join(' ')}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header: date + eye */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{format(new Date(match.matchDate), "dd 'de' MMM · HH:mm", { locale: es })}</span>
            <div className="flex items-center gap-2">
              {match.status === 'live' && (
                <Badge variant="outline" className="text-yellow-400 border-yellow-400 animate-pulse text-xs">EN VIVO</Badge>
              )}
              <button
                onClick={() => setShowPreds(true)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Ver predicciones"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
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

      <MatchPredsModal match={match} open={showPreds} onClose={() => setShowPreds(false)} />
    </>
  )
}
