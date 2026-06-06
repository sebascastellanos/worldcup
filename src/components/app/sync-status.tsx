'use client'

import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { RefreshCw, CheckCircle, AlertCircle, Clock, Lock } from 'lucide-react'
import type { SyncLog } from '@/lib/db/schema'

interface SyncStatusProps {
  logs: SyncLog[]
}

export function SyncStatus({ logs }: SyncStatusProps) {
  const last = logs[0]

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
          Sync API
        </div>
        {last ? (
          <span className="text-xs text-muted-foreground">
            Último: {formatDistanceToNow(last.ranAt, { locale: es, addSuffix: true })}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Sin datos aún</span>
        )}
      </div>

      {last && (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CheckCircle className="w-3.5 h-3.5 text-primary" />
            <span><span className="font-mono font-bold text-foreground">{last.synced}</span> partidos</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Lock className="w-3.5 h-3.5 text-yellow-500" />
            <span><span className="font-mono font-bold text-foreground">{last.locked}</span> pollas cerradas</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="capitalize">{last.source}</span>
          </div>
          {last.errors.length > 0 && (
            <div className="flex items-center gap-1.5 text-red-500">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{last.errors.length} error{last.errors.length > 1 ? 'es' : ''}</span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-1 max-h-40 overflow-y-auto">
        {logs.map((log) => (
          <div key={log.id} className="flex items-center justify-between text-xs py-1 border-t border-border first:border-t-0">
            <span className="text-muted-foreground">
              {formatDistanceToNow(log.ranAt, { locale: es, addSuffix: true })}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground capitalize">{log.source}</span>
              <span className="font-mono">
                {log.synced > 0 ? (
                  <span className="text-primary">+{log.synced}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </span>
              {log.locked > 0 && (
                <span className="text-yellow-500 font-mono">{log.locked} 🔒</span>
              )}
              {log.errors.length > 0 && (
                <span className="text-red-500">⚠</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
