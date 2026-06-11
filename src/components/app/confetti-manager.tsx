'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const STORAGE_KEY = 'confetti_shown_v1'

function getShown(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}

function markShown(id: string) {
  const set = getShown()
  set.add(id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}

async function fireConfetti(points: number) {
  const confetti = (await import('canvas-confetti')).default
  if (points === 3) {
    confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 } })
    setTimeout(() => confetti({ particleCount: 120, spread: 110, origin: { y: 0.55 } }), 250)
  } else {
    confetti({ particleCount: 80, spread: 65, origin: { y: 0.6 } })
  }
}

function showResult(points: number) {
  if (points === 3) {
    toast.success('🎯 ¡Marcador exacto!', { description: '+3 puntos — ¡perfecto!' })
  } else if (points === 1) {
    toast.success('✅ ¡Acertaste el resultado!', { description: '+1 punto' })
  } else {
    toast('Partido terminado', { description: 'No acertaste esta vez 😅' })
  }
}

interface Pred {
  id: string
  pointsEarned: number | null
}

interface ConfettiManagerProps {
  userId: string
  predictions: Pred[]
}

export function ConfettiManager({ userId, predictions }: ConfettiManagerProps) {
  const checkedMount = useRef(false)

  // Al entrar: predicciones ya puntuadas que aún no se mostraron
  useEffect(() => {
    if (checkedMount.current) return
    checkedMount.current = true

    const shown = getShown()
    const nuevas = predictions.filter(p => p.pointsEarned !== null && !shown.has(p.id))
    if (nuevas.length === 0) return

    for (const p of nuevas) markShown(p.id)

    const conPuntos = nuevas.filter(p => (p.pointsEarned ?? 0) > 0)
    if (conPuntos.length === 0) return

    const mejor = conPuntos.reduce((a, b) => (b.pointsEarned ?? 0) > (a.pointsEarned ?? 0) ? b : a)
    setTimeout(() => fireConfetti(mejor.pointsEarned!), 600)

    if (conPuntos.length === 1) {
      showResult(mejor.pointsEarned!)
    } else {
      toast.success(`✅ ¡Acertaste ${conPuntos.length} partidos mientras estabas fuera!`)
    }
  }, [predictions])

  // En vivo: cuando se calculan puntos en tiempo real
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('confetti-preds')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'predictions', filter: `user_id=eq.${userId}` },
        (payload) => {
          const p = payload.new as { id: string; points_earned: number | null }
          if (p.points_earned === null) return
          const shown = getShown()
          if (shown.has(p.id)) return
          markShown(p.id)
          showResult(p.points_earned)
          if (p.points_earned > 0) fireConfetti(p.points_earned)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  return null
}
