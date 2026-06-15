'use client'

import { useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Match, Prediction } from '@/lib/db/schema'

const STAGE_LABELS: Record<string, string> = {
  GROUP_A: 'Grupo A', GROUP_B: 'Grupo B', GROUP_C: 'Grupo C', GROUP_D: 'Grupo D',
  GROUP_E: 'Grupo E', GROUP_F: 'Grupo F', GROUP_G: 'Grupo G', GROUP_H: 'Grupo H',
  GROUP_I: 'Grupo I', GROUP_J: 'Grupo J', GROUP_K: 'Grupo K', GROUP_L: 'Grupo L',
  ROUND_OF_16: 'Octavos', QUARTER_FINALS: 'Cuartos',
  SEMI_FINALS: 'Semis', THIRD_PLACE: '3er Lugar', FINAL: 'Final',
}

function predLabel(pred: Prediction, match: Match): string {
  if (pred.predType === 'exact_score') return `${pred.predHome}–${pred.predAway}`
  if (pred.predType === 'home_win') return `Gana ${match.homeTeam}`
  if (pred.predType === 'away_win') return `Gana ${match.awayTeam}`
  return 'Empate'
}

interface FechasViewProps {
  matches: Match[]
  predMap: Map<string, Prediction>
  onNavigate: (matchId: string, stage: string) => void
}

export function FechasView({ matches, predMap, onNavigate }: FechasViewProps) {
  const sorted = [...matches].sort((a, b) =>
    new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
  )

  const byDate = sorted.reduce<Record<string, Match[]>>((acc, m) => {
    const key = format(new Date(m.matchDate), 'yyyy-MM-dd')
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  const dateKeys = Object.keys(byDate)
  const todayKey = format(new Date(), 'yyyy-MM-dd')

  // Scroll to today or the nearest upcoming date on mount
  useEffect(() => {
    const targetKey = dateKeys.find(k => k >= todayKey) ?? dateKeys[dateKeys.length - 1]
    if (!targetKey) return
    setTimeout(() => {
      document.getElementById(`fecha-${targetKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }, [])

  return (
    <div className="space-y-6">
      {Object.entries(byDate).map(([dateKey, dayMatches]) => (
        <div key={dateKey} id={`fecha-${dateKey}`} className="scroll-mt-4">
          <div className={[
            'text-xs font-semibold uppercase tracking-wide mb-2 px-1',
            dateKey === todayKey ? 'text-primary' : 'text-muted-foreground',
          ].join(' ')}>
            {dateKey === todayKey ? '► ' : ''}{format(new Date(dateKey + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es })}
          </div>
          <div className="space-y-1.5">
            {dayMatches.map(match => {
              const pred = predMap.get(match.id)
              const hasResult = match.status === 'finished' && match.homeScore !== null
              return (
                <div
                  key={match.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/70 border border-white/60 shadow-sm"
                >
                  <div className="text-xs text-muted-foreground w-10 shrink-0 font-mono">
                    {format(new Date(match.matchDate), 'HH:mm')}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {match.homeTeam} vs {match.awayTeam}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{STAGE_LABELS[match.stage] ?? match.stage}</span>
                      {hasResult && (
                        <span className="text-xs font-mono font-bold text-foreground">
                          {match.homeScore}–{match.awayScore}
                        </span>
                      )}
                      {match.status === 'live' && (
                        <span className="text-xs text-yellow-500 font-semibold animate-pulse">EN VIVO</span>
                      )}
                    </div>
                  </div>

                  {pred && (
                    <div className="shrink-0 text-right">
                      <div className="text-xs text-primary font-medium truncate max-w-[80px]">
                        {predLabel(pred, match)}
                      </div>
                      {match.status === 'finished' && pred.pointsEarned !== null && (
                        <div className={`text-xs font-bold ${pred.pointsEarned > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                          {pred.pointsEarned > 0 ? `+${pred.pointsEarned} pts` : '0 pts'}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => onNavigate(match.id, match.stage)}
                    className="shrink-0 text-xs px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
                  >
                    Ver
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
