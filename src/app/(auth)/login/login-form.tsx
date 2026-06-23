'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  async function handleForgotPassword() {
    if (!email) {
      toast.error('Ingresa tu email primero')
      return
    }
    setResetLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?type=recovery`,
    })
    setResetLoading(false)
    if (error) {
      toast.error('No se pudo enviar el correo')
      return
    }
    setResetSent(true)
    toast.success('Revisa tu correo')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('Email o contraseña incorrectos')
      setLoading(false)
      return
    }
    router.push(next ?? '/predictions')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Iniciar sesión</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Contraseña</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>

          {resetSent ? (
            <p className="text-xs text-center text-muted-foreground">
              Correo enviado a <span className="font-medium">{email}</span>. Revisa tu bandeja.
            </p>
          ) : (
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetLoading}
              className="w-full text-xs text-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {resetLoading ? 'Enviando...' : '¿Olvidaste tu contraseña?'}
            </button>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
