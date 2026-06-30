'use client'

import { useState, useEffect } from 'react'
import { BarChart2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'

const COLORS = [
  '#f97316', '#22c55e', '#3b82f6', '#a855f7', '#ec4899',
  '#14b8a6', '#f59e0b', '#ef4444', '#6366f1', '#84cc16', '#06b6d4',
]

type MetricsData = {
  matches: { id: string; label: string; stage: string }[]
  users: { id: string; name: string; series: number[] }[]
}

const W = 580
const H = 260
const PAD = { left: 40, right: 16, top: 20, bottom: 12 }
const cW = W - PAD.left - PAD.right
const cH = H - PAD.top - PAD.bottom

function LineChart({ data }: { data: MetricsData }) {
  const { matches, users } = data
  const N = matches.length
  if (N === 0) return <p className="text-sm text-muted-foreground py-6 text-center">Sin partidos finalizados</p>

  const maxPts = Math.max(...users.flatMap(u => u.series), 1)

  const sx = (i: number) => PAD.left + (N <= 1 ? cW / 2 : (i / (N - 1)) * cW)
  const sy = (pts: number) => PAD.top + cH - (pts / maxPts) * cH

  const knockoutIdx = matches.findIndex(m => !m.stage.startsWith('GROUP'))
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * maxPts))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {/* Grid horizontales */}
      {yTicks.map(tick => (
        <g key={tick}>
          <line
            x1={PAD.left} y1={sy(tick)} x2={W - PAD.right} y2={sy(tick)}
            stroke="currentColor" strokeOpacity={0.08} strokeWidth={1}
          />
          <text
            x={PAD.left - 6} y={sy(tick)} textAnchor="end" dominantBaseline="middle"
            fill="currentColor" fillOpacity={0.45} fontSize={9}
          >
            {tick}
          </text>
        </g>
      ))}

      {/* Separador grupos / eliminatorias */}
      {knockoutIdx > 0 && (
        <>
          <line
            x1={sx(knockoutIdx)} y1={PAD.top - 10}
            x2={sx(knockoutIdx)} y2={PAD.top + cH}
            stroke="currentColor" strokeOpacity={0.2} strokeWidth={1} strokeDasharray="3 2"
          />
          <text x={sx(knockoutIdx) - 6} y={PAD.top - 3} textAnchor="end"
            fill="currentColor" fillOpacity={0.35} fontSize={8}>
            Grupos
          </text>
          <text x={sx(knockoutIdx) + 6} y={PAD.top - 3} textAnchor="start"
            fill="currentColor" fillOpacity={0.35} fontSize={8}>
            Eliminatorias
          </text>
        </>
      )}

      {/* Eje X */}
      <line
        x1={PAD.left} y1={PAD.top + cH} x2={W - PAD.right} y2={PAD.top + cH}
        stroke="currentColor" strokeOpacity={0.12} strokeWidth={1}
      />

      {/* Líneas por usuario */}
      {users.map((user, i) => {
        const color = COLORS[i % COLORS.length]
        const d = user.series
          .map((pts, j) => `${j === 0 ? 'M' : 'L'}${sx(j).toFixed(1)},${sy(pts).toFixed(1)}`)
          .join(' ')
        return (
          <path key={user.id} d={d} fill="none" stroke={color} strokeWidth={2}
            strokeLinejoin="round" strokeLinecap="round" />
        )
      })}

      {/* Punto final de cada usuario */}
      {users.map((user, i) => {
        const color = COLORS[i % COLORS.length]
        const last = user.series[N - 1] ?? 0
        return <circle key={user.id} cx={sx(N - 1)} cy={sy(last)} r={3} fill={color} />
      })}
    </svg>
  )
}

export function UsersMetricsModal() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || data) return
    setLoading(true)
    fetch('/api/admin/metrics')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [open, data])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" />}>
        <BarChart2 className="w-3.5 h-3.5" />
        Métricas
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle>Histórico de puntos</DialogTitle>
        </DialogHeader>

        {loading && (
          <p className="text-sm text-muted-foreground py-10 text-center">Cargando...</p>
        )}

        {data && (
          <div className="space-y-4 pt-1">
            <LineChart data={data} />

            {/* Leyenda */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 border-t pt-3">
              {data.users.map((user, i) => (
                <div key={user.id} className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-xs text-muted-foreground truncate">{user.name}</span>
                  <span className="text-xs font-mono font-bold ml-auto shrink-0 tabular-nums">
                    {user.series[user.series.length - 1] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
