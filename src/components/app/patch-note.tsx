'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const KEY = 'patch_exact_5pts_v1'

export function PatchNote() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setVisible(true)
  }, [])

  function dismiss() {
    localStorage.setItem(KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-primary/5 border-primary/30 text-sm">
      <span className="text-lg shrink-0">🎯</span>
      <span className="flex-1 text-foreground">
        <span className="font-semibold">Actualización:</span> el marcador exacto ahora vale <span className="font-bold text-primary">5 puntos</span> (antes 3).
      </span>
      <button onClick={dismiss} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
