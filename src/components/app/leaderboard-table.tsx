'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Eye } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { User } from '@/lib/db/schema'
import type { PredType } from '@/lib/db/schema'

const MEDALS = ['🥇', '🥈', '🥉']

interface PredWithMatch {
  id: string
  predType: PredType
  predHome: number | null
  predAway: number | null
  pointsEarned: number | null
  match: {
    homeTeam: string
    awayTeam: string
    matchDate: Date
    status: string
    homeScore: number | null
    awayScore: number | null
    stage: string
  } | null
}

function predLabel(pred: PredWithMatch): string {
  if (!pred.match) return '—'
  if (pred.predType === 'exact_score') return `${pred.predHome}–${pred.predAway}`
  if (pred.predType === 'home_win') return `Gana ${pred.match.homeTeam}`
  if (pred.predType === 'away_win') return `Gana ${pred.match.awayTeam}`
  return 'Empate'
}

function PointsBadge({ points, status }: { points: number | null; status: string }) {
  if (status !== 'finished') return <span className="text-xs text-muted-foreground">—</span>
  const color = points === 3 ? 'bg-emerald-100 text-emerald-700' : points === 1 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{points ?? 0} pts</span>
}

function UserPredictionsModal({ user, open, onClose }: { user: User | null; open: boolean; onClose: () => void }) {
  const [preds, setPreds] = useState<PredWithMatch[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !user) return
    setLoading(true)
    fetch(`/api/users/${user.id}/predictions`)
      .then(r => r.json())
      .then(data => setPreds(data.predictions ?? []))
      .finally(() => setLoading(false))
  }, [open, user])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Avatar className="w-7 h-7">
              <AvatarFallback className="text-xs bg-muted">
                {user?.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {user?.name}
            <span className="text-muted-foreground font-normal text-sm ml-1">· {user?.totalPoints} pts</span>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 -mx-6 px-6">
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Cargando...</p>
          ) : preds.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sin predicciones aún.</p>
          ) : (
            <div className="space-y-2 py-2">
              {preds.map(pred => (
                <div key={pred.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {pred.match?.homeTeam} vs {pred.match?.awayTeam}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {pred.match ? format(new Date(pred.match.matchDate), "dd MMM · HH:mm", { locale: es }) : ''}
                      {pred.match?.status === 'finished' && pred.match.homeScore !== null
                        ? ` · ${pred.match.homeScore}–${pred.match.awayScore}`
                        : ''}
                    </div>
                    <div className="text-xs text-primary font-medium mt-0.5">{predLabel(pred)}</div>
                  </div>
                  <div className="shrink-0">
                    <PointsBadge points={pred.pointsEarned} status={pred.match?.status ?? ''} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface LeaderboardTableProps {
  initialUsers: User[]
}

export function LeaderboardTable({ initialUsers }: LeaderboardTableProps) {
  const [ranking, setRanking] = useState(initialUsers)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('leaderboard-full')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions' }, async () => {
        const res = await fetch('/api/leaderboard')
        if (res.ok) {
          const data = await res.json()
          setRanking(data.users)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="w-12">#</TableHead>
            <TableHead>Participante</TableHead>
            <TableHead className="text-right font-mono">Puntos</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {ranking.map((user, i) => (
            <TableRow key={user.id} className="border-border">
              <TableCell className="text-lg w-12">
                {MEDALS[i] ?? <span className="text-muted-foreground text-sm">{i + 1}</span>}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs bg-muted">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="font-medium text-sm">{user.name}</div>
                </div>
              </TableCell>
              <TableCell className="text-right font-mono font-bold text-primary text-lg">
                {user.totalPoints}
              </TableCell>
              <TableCell>
                <button
                  onClick={() => setSelectedUser(user)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </TableCell>
            </TableRow>
          ))}
          {ranking.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                Aún no hay participantes.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <UserPredictionsModal
        user={selectedUser}
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </>
  )
}
