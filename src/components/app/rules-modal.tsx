'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Info } from 'lucide-react'

const STORAGE_KEY = 'polla_rules_seen_v1'

export function RulesModal() {
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

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Ver reglas"
      >
        <Info className="w-4 h-4" />
      </button>

    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg">Bienvenido/a a la Polla Mundial 2026 ⚽</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-5 text-sm pr-1">
          <section className="space-y-2">
            <h3 className="font-semibold text-foreground">Cómo funciona</h3>
            <ul className="space-y-1.5 text-muted-foreground">
              <li>• Predice el resultado de cada partido <span className="text-foreground font-medium">antes de que empiece</span> (cierra 5 minutos antes del pitazo)</li>
              <li>• Puedes elegir: gana local, empate o gana visitante</li>
              <li>• Si quieres más puntos, adivina el marcador exacto</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-foreground">Puntos</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <span className="text-lg leading-none">1️⃣</span>
                <div>
                  <div className="font-medium text-foreground">Resultado correcto (1X2)</div>
                  <div className="text-muted-foreground text-xs mt-0.5">Gana local, empate o gana visitante → <span className="font-bold text-foreground">1 punto</span></div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <span className="text-lg leading-none">🎯</span>
                <div>
                  <div className="font-medium text-foreground">Marcador exacto</div>
                  <div className="text-muted-foreground text-xs mt-0.5">
                    Marcador exacto correcto → <span className="font-bold text-foreground">3 puntos</span><br />
                    
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <span className="text-lg leading-none">⚠️</span>
                <div className="text-amber-800 text-xs">
                  Si eliges marcador exacto <span className="font-bold">no</span> puedes elegir 1X2 al mismo tiempo — son opciones excluyentes. Una o la otra.
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-foreground">Premios 💰</h3>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">Entrada</span>
                <span className="font-bold text-foreground">$50.000 unico pago</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-yellow-50 border border-yellow-200">
                <span className="font-medium">🥇 1er lugar</span>
                <span className="font-bold text-yellow-700">70% de la bolsa</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-medium">🥈 2do lugar</span>
                <span className="font-bold text-slate-600">30% de la bolsa</span>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-foreground">Tips útiles</h3>
            <ul className="space-y-1.5 text-muted-foreground">
              <li>• El ranking se actualiza en tiempo real</li>
              <li>• Puedes ver las predicciones de los demás desde el ranking (ícono del ojo 👁)</li>
              <li>• Si no predices un partido antes de que cierre, no sumas puntos en ese partido</li>
            </ul>
          </section>
        </div>

        <Button onClick={handleClose} className="mt-4 w-full">
          ¡Entendido, a predecir!
        </Button>
      </DialogContent>
    </Dialog>
    </>
  )
}
