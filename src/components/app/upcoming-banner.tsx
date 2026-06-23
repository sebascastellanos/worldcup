'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react'
import type { Match, Prediction } from '@/lib/db/schema'

function useNow(intervalMs = 10000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'ahora'
  const totalMin = Math.floor(ms / 60000)
  const hours = Math.floor(totalMin / 60)
  const mins = totalMin % 60
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

interface UpcomingBannerProps {
  matches: Match[]
  predMap: Map<string, Prediction>
}

export function UpcomingBanner({ matches, predMap }: UpcomingBannerProps) {
  const now = useNow(10000)

  const cutoffFor = (m: Match) => new Date(new Date(m.matchDate).getTime() - 5 * 60 * 1000)

  // Next upcoming match (closest future cutoff)
  const upcoming = matches
    .filter(m => m.status === 'scheduled' && cutoffFor(m) > now)
    .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())[0]

  // Matches closing within 2 hours without a prediction
  const closingSoon = matches.filter(m => {
    if (m.status !== 'scheduled') return false
    if (predMap.has(m.id)) return false
    const cutoff = cutoffFor(m)
    const msLeft = cutoff.getTime() - now.getTime()
    return msLeft > 0 && msLeft <= 2 * 60 * 60 * 1000
  })

  if (!upcoming && closingSoon.length === 0) return null

  const msToNext = upcoming ? cutoffFor(upcoming).getTime() - now.getTime() : 0
  const hasPred = upcoming ? predMap.has(upcoming.id) : false
  const closingUrgent = closingSoon.some(m => cutoffFor(m).getTime() - now.getTime() <= 30 * 60 * 1000)

  return (
    <div className="space-y-2">
      {/* Próximo partido */}
      {upcoming && (
        <div className={[
          'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm',
          hasPred
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : msToNext <= 30 * 60 * 1000
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-blue-50 border-blue-200 text-blue-800',
        ].join(' ')}>
          <Clock className="w-4 h-4 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-medium">{upcoming.homeTeam} vs {upcoming.awayTeam}</span>
            <span className="text-xs ml-2 opacity-70">cierra en {formatCountdown(msToNext)}</span>
          </div>
          {hasPred ? (
            <div className="flex items-center gap-1 shrink-0 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Predicho
            </div>
          ) : (
            <span className="shrink-0 text-xs font-medium">Sin predicción</span>
          )}
        </div>
      )}

      {/* Partidos que cierran pronto sin predecir */}
      {closingSoon.length > 0 && (
        <div className={[
          'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm',
          closingUrgent
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-amber-50 border-amber-200 text-amber-800',
        ].join(' ')}>
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="flex-1">
            <span className="font-medium">
              {closingSoon.length === 1
                ? `${closingSoon[0].homeTeam} vs ${closingSoon[0].awayTeam}`
                : `${closingSoon.length} partidos`}
            </span>
            {' '}
            {closingSoon.length === 1 ? 'cierra' : 'cierran'} pronto y no {closingSoon.length === 1 ? 'has predicho' : 'has predicho todos'}
          </span>
        </div>
      )}
    </div>
  )
}
