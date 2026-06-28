'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

const STORAGE_KEY = 'polla_knockout_rules_v1'

export function KnockoutRulesModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true)
    }
  }, [])

  function handleClose() {
    localStorage.setItem(STORAGE_KEY, '1')
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-orange-100 text-sm font-medium uppercase tracking-widest mb-1">Fase Eliminatoria</p>
              <h2 className="text-white text-2xl font-black leading-tight">Nuevas reglas de puntuación</h2>
            </div>
            <button
              onClick={handleClose}
              className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="px-6 py-5 space-y-5">
          {/* Exacto */}
          <div className="flex gap-4">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
              <span className="text-violet-700 font-black text-lg">5</span>
            </div>
            <div>
              <p className="font-bold text-foreground">Marcador exacto</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Solo cuenta el marcador al <span className="font-semibold text-foreground">minuto 90</span>. Si el partido va a tiempo extra y el marcador cambia, tu predicción exacta ya cerró — solo importa lo que pasó en los 90 minutos reglamentarios.
              </p>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* 1X2 */}
          <div className="flex gap-4">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <span className="text-amber-700 font-black text-lg">1</span>
            </div>
            <div>
              <p className="font-bold text-foreground">Resultado 1X2</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Cuenta el resultado al <span className="font-semibold text-foreground">minuto 120</span> (tiempo extra incluido).
              </p>
              <ul className="mt-2 space-y-1.5">
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 font-bold mt-0.5">✓</span>
                  <span>Tu equipo gana en tiempo extra → <span className="font-semibold">1 punto</span></span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 font-bold mt-0.5">✓</span>
                  <span>Empatan al 120' y van a penales → la predicción de <span className="font-semibold">empate gana el punto</span></span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-red-400 font-bold mt-0.5">✗</span>
                  <span>Los <span className="font-semibold">penales no cuentan</span> para ninguna predicción</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <Button onClick={handleClose} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold">
            Entendido
          </Button>
        </div>
      </div>
    </div>
  )
}
