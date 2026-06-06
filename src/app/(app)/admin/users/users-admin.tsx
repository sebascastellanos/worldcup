'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { User } from '@/lib/db/schema'

function ProgressCircle({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  const color = pct === 100 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#64748b'
  return (
    <div className="relative w-9 h-9 shrink-0">
      <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-border" />
        <circle
          cx="18" cy="18" r="15.9" fill="none" strokeWidth="3"
          stroke={color}
          strokeDasharray={`${pct} 100`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold" style={{ color }}>
        {pct}%
      </span>
    </div>
  )
}

export function UsersAdmin({ initialUsers, currentUserId, totalMatches, predCountMap }: {
  initialUsers: User[]
  currentUserId: string
  totalMatches: number
  predCountMap: Record<string, number>
}) {
  const [users, setUsers] = useState(initialUsers)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(userId: string, name: string) {
    if (!confirm(`¿Eliminar a ${name}? Se borrarán todas sus predicciones.`)) return
    setDeleting(userId)
    const res = await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' })
    setDeleting(null)
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error ?? 'Error al eliminar')
      return
    }
    setUsers(prev => prev.filter(u => u.id !== userId))
    toast.success(`${name} eliminado`)
  }

  return (
    <div className="p-6 max-w-[800px] mx-auto">
      <h1 className="text-xl font-bold mb-6">Participantes ({users.length})</h1>
      <Table>
        <TableHeader>
          <TableRow className="border-border">
            <TableHead>Participante</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead className="text-center">Progreso</TableHead>
            <TableHead className="text-right font-mono">Puntos</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(u => (
            <TableRow key={u.id} className="border-border">
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="text-xs bg-muted">{u.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{u.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
              <TableCell>
                <Badge variant={u.role === 'admin' ? 'default' : 'outline'} className="text-xs">
                  {u.role}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex flex-col items-center gap-0.5">
                  <ProgressCircle value={predCountMap[u.id] ?? 0} total={totalMatches} />
                  <span className="text-[10px] text-muted-foreground">{predCountMap[u.id] ?? 0}/{totalMatches}</span>
                </div>
              </TableCell>
              <TableCell className="text-right font-mono font-bold text-primary">
                {u.totalPoints}
              </TableCell>
              <TableCell>
                {u.id !== currentUserId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(u.id, u.name)}
                    disabled={deleting === u.id}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
