'use client'

import { useState } from 'react'
import { MatchCard } from './match-card'
import type { Match, Prediction } from '@/lib/db/schema'

type PredMap = Map<string, Prediction>

interface KnockoutTabsProps {
  grouped: Record<string, Match[]>
  predMap: PredMap
  onPredChange: (matchId: string, pred: Prediction | null) => void
}

const KNOCKOUT_TABS = [
  {
    key: 'dieciseisavos',
    label: 'Dieciseisavos',
    apiStages: ['LAST_32', 'ROUND_OF_32'],
    placeholders: Array.from({ length: 16 }, (_, i) => ({
      home: `Clasificado ${i * 2 + 1}`,
      away: `Clasificado ${i * 2 + 2}`,
    })),
  },
  {
    key: 'octavos',
    label: 'Octavos',
    apiStages: ['LAST_16', 'ROUND_OF_16'],
    placeholders: Array.from({ length: 8 }, (_, i) => ({
      home: `Gan. D16-${i * 2 + 1}`,
      away: `Gan. D16-${i * 2 + 2}`,
    })),
  },
  {
    key: 'cuartos',
    label: 'Cuartos',
    apiStages: ['QUARTER_FINALS'],
    placeholders: Array.from({ length: 4 }, (_, i) => ({
      home: `Gan. Oct-${i * 2 + 1}`,
      away: `Gan. Oct-${i * 2 + 2}`,
    })),
  },
  {
    key: 'semis',
    label: 'Semifinales',
    apiStages: ['SEMI_FINALS'],
    placeholders: [
      { home: 'Gan. Cuartos 1', away: 'Gan. Cuartos 2' },
      { home: 'Gan. Cuartos 3', away: 'Gan. Cuartos 4' },
    ],
  },
  {
    key: 'final',
    label: 'Final',
    apiStages: ['FINAL'],
    placeholders: [
      { home: 'Gan. Semifinal 1', away: 'Gan. Semifinal 2' },
    ],
  },
]

function PlaceholderCard({ home, away }: { home: string; away: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 p-4 space-y-3 opacity-60">
      <div className="text-xs text-muted-foreground italic text-center">Por definir</div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 text-right">
          <span className="text-sm text-muted-foreground truncate block">{home}</span>
        </div>
        <div className="text-muted-foreground/50 text-sm font-medium px-2 shrink-0">vs</div>
        <div className="flex-1">
          <span className="text-sm text-muted-foreground truncate block">{away}</span>
        </div>
      </div>
    </div>
  )
}

export function KnockoutTabs({ grouped, predMap, onPredChange }: KnockoutTabsProps) {
  const [activeTab, setActiveTab] = useState('dieciseisavos')

  const current = KNOCKOUT_TABS.find(t => t.key === activeTab)!
  const realMatches = current.apiStages.flatMap(s => grouped[s] ?? [])
  const hasReal = realMatches.length > 0

  // Also handle THIRD_PLACE in the Final tab
  const thirdPlaceMatches = activeTab === 'final' ? (grouped['THIRD_PLACE'] ?? []) : []

  return (
    <div className="space-y-4">
      {/* Inner tabs */}
      <div className="flex gap-1 flex-wrap">
        {KNOCKOUT_TABS.map(tab => {
          const hasData = tab.apiStages.some(s => (grouped[s]?.length ?? 0) > 0)
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={[
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 border',
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : hasData
                  ? 'bg-card text-foreground border-border hover:border-primary/50'
                  : 'bg-card text-muted-foreground border-border hover:border-border',
              ].join(' ')}
            >
              {tab.label}
              {hasData && (
                <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-green-500 inline-block align-middle" />
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {hasReal ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {realMatches.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={predMap.get(match.id)}
                onPredChange={onPredChange}
              />
            ))}
          </div>
          {thirdPlaceMatches.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tercer Lugar</p>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {thirdPlaceMatches.map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    prediction={predMap.get(match.id)}
                    onPredChange={onPredChange}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {current.placeholders.map((p, i) => (
              <PlaceholderCard key={i} home={p.home} away={p.away} />
            ))}
          </div>
          {activeTab === 'final' && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tercer Lugar</p>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                <PlaceholderCard home="3° Semifinal 1" away="3° Semifinal 2" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
