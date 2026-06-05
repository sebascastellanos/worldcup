'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { User } from '@/lib/db/schema'

const MEDALS = ['🥇', '🥈', '🥉']

interface LeaderboardTableProps {
  initialUsers: User[]
}

export function LeaderboardTable({ initialUsers }: LeaderboardTableProps) {
  const [ranking, setRanking] = useState(initialUsers)

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
    <Table>
      <TableHeader>
        <TableRow className="border-border hover:bg-transparent">
          <TableHead className="w-12">#</TableHead>
          <TableHead>Participante</TableHead>
          <TableHead className="text-right font-mono">Puntos</TableHead>
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
                <div>
                  <div className="font-medium text-sm">{user.name}</div>
                  {user.role === 'admin' && (
                    <div className="text-xs text-muted-foreground">Admin</div>
                  )}
                </div>
              </div>
            </TableCell>
            <TableCell className="text-right font-mono font-bold text-primary text-lg">
              {user.totalPoints}
            </TableCell>
          </TableRow>
        ))}
        {ranking.length === 0 && (
          <TableRow>
            <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
              Aún no hay participantes.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
