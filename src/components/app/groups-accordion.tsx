'use client'

import { useState, useRef } from 'react'
import { MatchCard } from './match-card'
import { KnockoutTabs } from './knockout-bracket'
import type { Match, Prediction } from '@/lib/db/schema'

type PredMap = Map<string, Prediction>

const GROUP_STAGES = [
  'GROUP_A', 'GROUP_B', 'GROUP_C', 'GROUP_D',
  'GROUP_E', 'GROUP_F', 'GROUP_G', 'GROUP_H',
  'GROUP_I', 'GROUP_J', 'GROUP_K', 'GROUP_L',
  'GROUP_Z',
]

const KNOCKOUT_STAGES = ['ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'THIRD_PLACE', 'FINAL']

const STAGE_LABELS: Record<string, string> = {
  GROUP_A: 'A', GROUP_B: 'B', GROUP_C: 'C', GROUP_D: 'D',
  GROUP_E: 'E', GROUP_F: 'F', GROUP_G: 'G', GROUP_H: 'H',
  GROUP_I: 'I', GROUP_J: 'J', GROUP_K: 'K', GROUP_L: 'L', GROUP_Z: 'Z',
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
        'group relative flex flex-col gap-3 p-4 rounded-2xl border text-left transition-all duration-200',
        'hover:shadow-lg hover:-translate-y-1 active:translate-y-0',
        isOpen
          ? 'border-primary/40 shadow-lg shadow-primary/10 bg-white'
          : 'border-white/80 bg-white/70 backdrop-blur-sm hover:bg-white hover:border-primary/30',
      ].join(' ')}
    >
      {/* Barra de color superior */}
      <div className={[
        'absolute top-0 left-0 right-0 h-1 rounded-t-2xl transition-all duration-300',
        isOpen ? 'bg-gradient-to-r from-emerald-400 to-green-600' : 'bg-border group-hover:bg-gradient-to-r group-hover:from-emerald-300 group-hover:to-green-400',
      ].join(' ')} />

      <div className="flex items-center justify-between pt-1">
        <div className={[
          'text-4xl font-black leading-none transition-colors',
          isOpen ? 'text-primary' : 'text-slate-700',
        ].join(' ')}>
          {label}
        </div>
        <div className={[
          'text-xs font-bold px-2 py-0.5 rounded-full transition-all',
          isOpen ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
        ].join(' ')}>
          {progress}%
        </div>
      </div>

      <div className="space-y-1 min-h-[4rem]">
        {teams.map(t => (
          <div key={t} className="text-sm font-medium text-slate-600 truncate leading-snug">{t}</div>
        ))}
      </div>

      <div className="space-y-1">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-400 to-green-600"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground">{predCount}/{matches.length} predicciones</div>
      </div>
    </button>
  )
}

export function GroupsAccordion({ matches, predMap: initialPredMap }: GroupsAccordionProps) {
  const [activeTab, setActiveTab] = useState<Tab>('groups')
  const [openStage, setOpenStage] = useState<string | null>(null)
  const [predMap, setPredMap] = useState<PredMap>(initialPredMap)
  const matchesRef = useRef<HTMLDivElement>(null)

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

  const totalGroupMatches = groupStages.reduce((sum, s) => sum + (grouped[s]?.length ?? 0), 0)
  const totalGroupPreds = groupStages.reduce((sum, s) =>
    sum + (grouped[s]?.filter(m => predMap.has(m.id)).length ?? 0), 0)
  const overallProgress = totalGroupMatches > 0 ? Math.round((totalGroupPreds / totalGroupMatches) * 100) : 0

  function toggle(stage: string) {
    const next = openStage === stage ? null : stage
    setOpenStage(next)
    if (next) {
      setTimeout(() => {
        matchesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    }
  }

  return (
    <div className="space-y-5">
      {/* Tabs + progress */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          <button
            onClick={() => { setActiveTab('groups'); setOpenStage(null) }}
            className={[
              'px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
              activeTab === 'groups'
                ? 'bg-card text-foreground shadow-sm'
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
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            Eliminatorias
          </button>
        </div>

        {activeTab === 'groups' && totalGroupMatches > 0 && (
          <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-2 shrink-0">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Progreso total</div>
              <div className="text-sm font-bold text-foreground">{totalGroupPreds}/{totalGroupMatches}</div>
            </div>
            <div className="relative w-10 h-10 shrink-0">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-border" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3"
                  strokeDasharray={`${overallProgress} 100`}
                  strokeLinecap="round"
                  className="text-primary transition-all duration-500"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-primary">
                {overallProgress}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {activeTab === 'knockout' ? (
        <KnockoutTabs grouped={grouped} predMap={predMap} onPredChange={handlePredChange} />
      ) : groupStages.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No hay partidos cargados.</p>
      ) : (
        <>
          {/* Grid estático — no se mueve */}
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

          {/* Área de partidos — contenido fijo, solo cambia lo de adentro */}
          <div ref={matchesRef} className="scroll-mt-4">
            {openStage && grouped[openStage] ? (
              <div className="bg-white/40 backdrop-blur-sm border border-white/60 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-semibold text-foreground">
                    Grupo {STAGE_LABELS[openStage]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    · {grouped[openStage].filter(m => predMap.has(m.id)).length}/{grouped[openStage].length} predicciones
                  </span>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {grouped[openStage].map(match => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      prediction={predMap.get(match.id)}
                      onPredChange={handlePredChange}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
                Selecciona un grupo para ver los partidos
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
