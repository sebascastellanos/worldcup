'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { RefreshCw, RotateCcw } from 'lucide-react'
import type { Match } from '@/lib/db/schema'

const STATUS_LABELS = { scheduled: 'Programado', live: 'En vivo', finished: 'Finalizado' }
const STATUS_COLORS = { scheduled: 'outline', live: 'default', finished: 'secondary' } as const

function ResultEditor({ match, onUpdated }: { match: Match; onUpdated: (m: Match) => void }) {
  const [homeScore, setHomeScore] = useState(match.homeScore?.toString() ?? '')
  const [awayScore, setAwayScore] = useState(match.awayScore?.toString() ?? '')
  const [status, setStatus] = useState<'live' | 'finished'>(match.status === 'live' ? 'live' : 'finished')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  async function handleSave() {
    setLoading(true)
    const res = await fetch('/api/admin/matches', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId: match.id, homeScore: parseInt(homeScore), awayScore: parseInt(awayScore), status }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error('Error al guardar'); return }
    toast.success(`Resultado guardado · ${data.pointsUpdated} predicciones actualizadas`)
    onUpdated(data.match)
    setOpen(false)
  }

  async function handleReset() {
    setLoading(true)
    const res = await fetch('/api/admin/matches', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId: match.id, status: 'scheduled' }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error('Error al resetear'); return }
    setHomeScore('')
    setAwayScore('')
    setStatus('finished')
    toast.success('Partido reseteado a estado inicial')
    onUpdated(data.match)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <span className="inline-flex items-center justify-center rounded-md border border-border bg-transparent px-2.5 py-1 text-xs font-medium hover:bg-accent cursor-pointer transition-colors">
          Editar
        </span>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">{match.homeTeam} vs {match.awayTeam}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3 justify-center">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">{match.homeTeam}</div>
              <Input type="number" min="0" value={homeScore} onChange={e => setHomeScore(e.target.value)} className="w-16 text-center font-mono text-lg h-12" />
            </div>
            <span className="text-muted-foreground font-bold text-xl mt-4">–</span>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">{match.awayTeam}</div>
              <Input type="number" min="0" value={awayScore} onChange={e => setAwayScore(e.target.value)} className="w-16 text-center font-mono text-lg h-12" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant={status === 'live' ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setStatus('live')}>En vivo</Button>
            <Button variant={status === 'finished' ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setStatus('finished')}>Finalizado</Button>
          </div>
          <Button className="w-full" onClick={handleSave} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar resultado'}
          </Button>
          <Button variant="outline" size="sm" className="w-full gap-2 text-muted-foreground" onClick={handleReset} disabled={loading}>
            <RotateCcw className="w-3.5 h-3.5" />
            Resetear a programado
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function MatchesAdmin({ initialMatches }: { initialMatches: Match[] }) {
  const [matchList, setMatchList] = useState(initialMatches)
  const [syncing, setSyncing] = useState(false)

  function handleUpdated(updated: Match) {
    setMatchList(prev => prev.map(m => m.id === updated.id ? updated : m))
  }

  async function handleSync() {
    setSyncing(true)
    const res = await fetch('/api/admin/sync', { method: 'POST' })
    const data = await res.json()
    setSyncing(false)
    if (!res.ok) {
      toast.error(data.error ?? 'Error al sincronizar')
      return
    }
    toast.success(`Sincronizado: ${data.synced} partidos actualizados`)
    if (data.errors?.length) toast.warning(`${data.errors.length} errores`)
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar desde API'}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-border">
            <TableHead>Partido</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Grupo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Resultado</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matchList.map(match => (
            <TableRow key={match.id} className="border-border">
              <TableCell className="font-medium text-sm">{match.homeTeam} vs {match.awayTeam}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(match.matchDate), 'dd MMM · HH:mm', { locale: es })}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{match.stage}</TableCell>
              <TableCell>
                <Badge variant={STATUS_COLORS[match.status]} className="text-xs">
                  {STATUS_LABELS[match.status]}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {match.homeScore !== null ? `${match.homeScore}–${match.awayScore}` : '–'}
              </TableCell>
              <TableCell>
                <ResultEditor match={match} onUpdated={handleUpdated} />
              </TableCell>
            </TableRow>
          ))}
          {matchList.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No hay partidos. Usa "Sincronizar desde API" para importarlos.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
