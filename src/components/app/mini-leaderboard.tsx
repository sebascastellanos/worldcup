'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { User } from '@/lib/db/schema'

const MEDALS = ['🥇', '🥈', '🥉']

interface MiniLeaderboardProps {
  initialUsers: User[]
}

export function MiniLeaderboard({ initialUsers }: MiniLeaderboardProps) {
  const [ranking, setRanking] = useState(initialUsers)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('leaderboard-mini')
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
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Ranking General
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {ranking.map((user, i) => (
          <div key={user.id} className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              <span className="text-base w-5">{MEDALS[i] ?? `${i + 1}.`}</span>
              <span className="text-sm font-medium truncate max-w-[120px]">{user.name}</span>
            </div>
            <span className="font-mono text-sm text-primary font-bold">{user.totalPoints}</span>
          </div>
        ))}
        {ranking.length === 0 && (
          <p className="text-xs text-muted-foreground">Aún no hay puntos.</p>
        )}
      </CardContent>
    </Card>
  )
}
