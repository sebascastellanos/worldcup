'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error('No se pudo actualizar la contraseña')
      setLoading(false)
      return
    }
    toast.success('Contraseña actualizada')
    router.push('/predictions')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Nueva contraseña</CardTitle>
        <CardDescription className="text-center">Elige una contraseña segura</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nueva contraseña</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Confirmar contraseña</label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repite la contraseña"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar contraseña'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
