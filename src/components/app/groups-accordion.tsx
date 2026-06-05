'use client'

import { useState } from 'react'
import { MatchCard } from './match-card'
import { KnockoutTabs } from './knockout-bracket'
import type { Match, Prediction } from '@/lib/db/schema'

type PredMap = Map<string, Prediction>

const GROUP_STAGES = [
  'GROUP_A', 'GROUP_B', 'GROUP_C', 'GROUP_D',
  'GROUP_E', 'GROUP_F', 'GROUP_G', 'GROUP_H',
  'GROUP_I', 'GROUP_J', 'GROUP_K', 'GROUP_L',
]

const KNOCKOUT_STAGES = ['ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'THIRD_PLACE', 'FINAL']

const STAGE_LABELS: Record<string, string> = {
  GROUP_A: 'A', GROUP_B: 'B', GROUP_C: 'C', GROUP_D: 'D',
  GROUP_E: 'E', GROUP_F: 'F', GROUP_G: 'G', GROUP_H: 'H',
  GROUP_I: 'I', GROUP_J: 'J', GROUP_K: 'K', GROUP_L: 'L',
  ROUND_OF_16: 'Octavos', QUARTER_FINALS: 'Cuartos',
  SEMI_FINALS: 'Semis', THIRD_PLACE: '3er Lugar', FINAL: 'Final',
}

const ALL_STAGES = [...GROUP_STAGES, ...KNOCKOUT_STAGES]

type Tab = 'groups' | 'knockout'

interface GroupsAccordionProps {
  matches: Match[]
  predMap: Map<string, Prediction>
}

function GroupCard({
  stage,
  matches,
  predCount,
  isOpen,
  onClick,
}: {
  stage: string
  matches: Match[]
  predCount: number
  isOpen: boolean
  onClick: () => void
}) {
  const label = STAGE_LABELS[stage] ?? stage
  const teams = Array.from(new Set(matches.flatMap(m => [m.homeTeam, m.awayTeam]))).slice(0, 4)
  const progress = matches.length > 0 ? Math.round((predCount / matches.length) * 100) : 0

  return (
    <button
      onClick={onClick}
      className={[
        'group relative flex flex-col gap-3 p-4 rounded-xl border text-left transition-all duration-200',
        'hover:shadow-md hover:-translate-y-0.5 active:translate-y-0',
        isOpen
          ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
          : 'border-border bg-card hover:border-primary/40',
      ].join(' ')}
    >
      {/* Group letter */}
      <div className="flex items-center justify-between">
        <div className={[
          'text-2xl font-black leading-none transition-colors',
          isOpen ? 'text-primary' : 'text-foreground',
        ].join(' ')}>
          {label}
        </div>
        <div className={[
          'w-2 h-2 rounded-full transition-all duration-300',
          isOpen ? 'bg-primary scale-125' : 'bg-border group-hover:bg-primary/40',
        ].join(' ')} />
      </div>

      {/* Teams */}
      <div className="space-y-0.5 min-h-[3rem]">
        {teams.map(t => (
          <div key={t} className="text-xs text-muted-foreground truncate leading-relaxed">{t}</div>
        ))}
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{predCount}/{matches.length} preds</span>
          <span className={isOpen ? 'text-primary font-medium' : 'text-muted-foreground'}>{progress}%</span>
        </div>
        <div className="h-1 bg-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-primary"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </button>
  )
}

function MatchesPanel({ matches, predMap, isOpen, onPredChange }: {
  matches: Match[]
  predMap: PredMap
  isOpen: boolean
  onPredChange: (matchId: string, pred: Prediction | null) => void
}) {
  return (
    <div
      className="grid transition-[grid-template-rows] duration-300 ease-in-out"
      style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
    >
      <div className="overflow-hidden min-h-0">
        <div className="pt-3 pb-1">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {matches.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={predMap.get(match.id)}
                onPredChange={onPredChange}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function GroupsAccordion({ matches, predMap: initialPredMap }: GroupsAccordionProps) {
  const [activeTab, setActiveTab] = useState<Tab>('groups')
  const [openStage, setOpenStage] = useState<string | null>(null)
  const [predMap, setPredMap] = useState<PredMap>(initialPredMap)

  function handlePredChange(matchId: string, pred: Prediction | null) {
    setPredMap(prev => {
      const next = new Map(prev)
      if (pred) next.set(matchId, pred)
      else next.delete(matchId)
      return next
    })
  }

  const grouped = matches.reduce<Record<string, Match[]>>((acc, m) => {
    if (!acc[m.stage]) acc[m.stage] = []
    acc[m.stage].push(m)
    return acc
  }, {})

  const groupStages = ALL_STAGES.filter(s => GROUP_STAGES.includes(s) && grouped[s])
  const knockoutStages = ALL_STAGES.filter(s => KNOCKOUT_STAGES.includes(s) && grouped[s])

  const hasKnockout = knockoutStages.length > 0
  const currentStages = activeTab === 'groups' ? groupStages : knockoutStages

  function toggle(stage: string) {
    setOpenStage(prev => (prev === stage ? null : stage))
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        <button
          onClick={() => { setActiveTab('groups'); setOpenStage(null) }}
          className={[
            'px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
            activeTab === 'groups'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          ].join(' ')}
        >
          Fase de Grupos
        </button>
        <button
          onClick={() => { setActiveTab('knockout'); setOpenStage(null) }}
          className={[
            'px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
            activeTab === 'knockout'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          ].join(' ')}
        >
          Eliminatorias
        </button>
      </div>

      {/* Content */}
      {activeTab === 'knockout' ? (
        <KnockoutTabs grouped={grouped} predMap={predMap} onPredChange={handlePredChange} />
      ) : groupStages.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No hay partidos cargados.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {groupStages.map(stage => (
              <GroupCard
                key={stage}
                stage={stage}
                matches={grouped[stage]}
                predCount={grouped[stage].filter(m => predMap.has(m.id)).length}
                isOpen={openStage === stage}
                onClick={() => toggle(stage)}
              />
            ))}
          </div>

          {groupStages.map(stage => (
            <MatchesPanel
              key={stage}
              matches={grouped[stage]}
              predMap={predMap}
              isOpen={openStage === stage}
              onPredChange={handlePredChange}
            />
          ))}
        </>
      )}
    </div>
  )
}
