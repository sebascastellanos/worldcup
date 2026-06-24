import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ScoreBadgeProps {
  points: number
  status: 'scheduled' | 'live' | 'finished'
}

export function ScoreBadge({ points, status }: ScoreBadgeProps) {
  if (status === 'scheduled') return null
  if (status === 'live') return (
    <Badge variant="outline" className="text-yellow-400 border-yellow-400 animate-pulse text-xs">
      EN VIVO
    </Badge>
  )
  return (
    <Badge
      className={cn(
        'text-xs font-mono font-bold',
        points === 5 && 'bg-violet-600 text-white',
        points === 1 && 'bg-secondary text-secondary-foreground',
        points === 0 && 'bg-muted text-muted-foreground',
      )}
    >
      {points === 5 ? '+5 pts' : points === 1 ? '+1 pt' : '0 pts'}
    </Badge>
  )
}
