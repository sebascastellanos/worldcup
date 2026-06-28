'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { PredType, Prediction } from '@/lib/db/schema'

interface PredictionFormProps {
  matchId: string
  homeTeam: string
  awayTeam: string
  currentPred?: { predType: PredType; predHome?: number | null; predAway?: number | null } | null
  locked: boolean
  isKnockout?: boolean
  onPredChange?: (matchId: string, pred: Prediction | null) => void
}

const OUTCOME_BUTTONS: { type: Exclude<PredType, 'exact_score'>; label: string; gradient: string; activeBg: string; hoverBg: string }[] = [
  {
    type: 'home_win',
    label: 'Gana Local',
    gradient: 'bg-gradient-to-r from-emerald-500 to-green-600',
    activeBg: 'bg-emerald-50 border-emerald-400 text-emerald-200',
    hoverBg: 'hover:bg-emerald-50 hover:border-emerald-300',
  },
  {
    type: 'draw',
    label: 'Empate',
    gradient: 'bg-gradient-to-r from-amber-400 to-orange-500',
    activeBg: 'bg-amber-50 border-amber-400 text-amber-200',
    hoverBg: 'hover:bg-amber-50 hover:border-amber-300',
  },
  {
    type: 'away_win',
    label: 'Gana Visit.',
    gradient: 'bg-gradient-to-r from-blue-500 to-indigo-600',
    activeBg: 'bg-blue-50 border-blue-400 text-blue-200',
    hoverBg: 'hover:bg-blue-50 hover:border-blue-300',
  },
]

export function PredictionForm({ matchId, homeTeam, awayTeam, currentPred, locked, isKnockout, onPredChange }: PredictionFormProps) {
  const [selected, setSelected] = useState<PredType | null>(currentPred?.predType ?? null)
  const [exactMode, setExactMode] = useState(false)
  const [predHome, setPredHome] = useState(currentPred?.predHome?.toString() ?? '')
  const [predAway, setPredAway] = useState(currentPred?.predAway?.toString() ?? '')
  const [pending, startTransition] = useTransition()
  const [hoveredType, setHoveredType] = useState<PredType | null>(null)

  if (locked) {
    return (
      <div className="text-xs text-muted-foreground italic">
        Predicciones cerradas
      </div>
    )
  }

  async function save(type: PredType, home?: number, away?: number) {
    startTransition(async () => {
      const body: Record<string, unknown> = { matchId, predType: type }
      if (type === 'exact_score') { body.predHome = home; body.predAway = away }

      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { toast.error('No se pudo guardar 5 min antes de que comience el partido'); return }
      const data = await res.json()
      setSelected(type)
      if (type === 'exact_score') setExactMode(false)
      onPredChange?.(matchId, data.prediction)
      toast.success('Predicción guardada')
    })
  }

  async function unselect() {
    startTransition(async () => {
      const res = await fetch(`/api/predictions?matchId=${matchId}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('No se pudo desmarcar'); return }
      setSelected(null)
      setExactMode(false)
      onPredChange?.(matchId, null)
      toast.success('Predicción desmarcada')
    })
  }

  function handleOutcomeClick(type: Exclude<PredType, 'exact_score'>) {
    setHoveredType(null)
    if (selected === type && !exactMode) { unselect(); return }
    setExactMode(false)
    save(type)
  }

  function handleExactSubmit(e: React.FormEvent) {
    e.preventDefault()
    const h = parseInt(predHome)
    const a = parseInt(predAway)
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      toast.error('Ingresa un marcador válido')
      return
    }
    save('exact_score', h, a)
  }

  return (
    <div className="space-y-2">
      {/* 1X2 buttons */}
      <div className="flex gap-1.5">
        {OUTCOME_BUTTONS.map(({ type, label, gradient, activeBg, hoverBg }) => {
          const isActive = selected === type && !exactMode
          const isHoveringActive = isActive && hoveredType === type
          return (
            <button
              key={type}
              onClick={() => handleOutcomeClick(type)}
              onMouseEnter={() => setHoveredType(type)}
              onMouseLeave={() => setHoveredType(null)}
              disabled={pending}
              className={[
                'flex-1 text-xs h-8 rounded-md border font-semibold transition-all duration-150 disabled:opacity-50',
                isHoveringActive
                  ? 'bg-red-500/10 border-red-400 text-red-500'
                  : isActive
                  ? `${gradient} text-white border-transparent shadow-sm`
                  : `bg-transparent border-border text-muted-foreground ${hoverBg}`,
              ].join(' ')}
            >
              {isHoveringActive ? '✕ Desmarcar' : label}
            </button>
          )
        })}
      </div>

      {/* Exact score section */}
      {selected === 'exact_score' && !exactMode ? (
        <div className="flex items-center gap-2">
          <button
            onMouseEnter={() => setHoveredType('exact_score')}
            onMouseLeave={() => setHoveredType(null)}
            onClick={unselect}
            disabled={pending}
            className={[
              'text-xs h-8 px-3 rounded-md border font-medium transition-all duration-150 disabled:opacity-50',
              hoveredType === 'exact_score'
                ? 'bg-red-500/10 border-red-500 text-red-500'
                : 'bg-primary/10 border-primary text-primary',
            ].join(' ')}
          >
            {hoveredType === 'exact_score' ? 'Desmarcar' : `Marcador: ${predHome}–${predAway}`}
          </button>
          <button
            onClick={() => setExactMode(true)}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Editar
          </button>
        </div>
      ) : !exactMode ? (
        <button
          onClick={() => setExactMode(true)}
          className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2 transition-colors"
        >
          {isKnockout ? 'Acertar marcador al 90\' (5 pts)' : 'Acertar marcador exacto (5 pts)'}
        </button>
      ) : (
        <form onSubmit={handleExactSubmit} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground truncate max-w-[60px]">{homeTeam}</span>
          <Input
            type="number"
            min="0"
            value={predHome}
            onChange={(e) => setPredHome(e.target.value)}
            className="w-12 h-8 text-center font-mono text-sm p-1"
          />
          <span className="text-muted-foreground font-bold">–</span>
          <Input
            type="number"
            min="0"
            value={predAway}
            onChange={(e) => setPredAway(e.target.value)}
            className="w-12 h-8 text-center font-mono text-sm p-1"
          />
          <span className="text-xs text-muted-foreground truncate max-w-[60px]">{awayTeam}</span>
          <Button type="submit" size="sm" className="h-8 px-3 text-xs" disabled={pending}>
            {pending ? '...' : 'Guardar'}
          </Button>
        </form>
      )}
    </div>
  )
}
