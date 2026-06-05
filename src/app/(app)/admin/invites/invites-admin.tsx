'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { InviteToken } from '@/lib/db/schema'

export function InvitesAdmin({ initialTokens }: { initialTokens: InviteToken[] }) {
  const [tokens, setTokens] = useState(initialTokens)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  async function generateToken() {
    setLoading(true)
    const res = await fetch('/api/admin/invites', { method: 'POST' })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error('Error al generar'); return }
    const link = `${baseUrl}/invite/${data.token}`
    await navigator.clipboard.writeText(link)
    toast.success('Link copiado al portapapeles')
    const res2 = await fetch('/api/admin/invites')
    if (res2.ok) {
      const d2 = await res2.json()
      setTokens(d2.tokens)
    }
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(`${baseUrl}/invite/${token}`)
    toast.success('Link copiado')
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    const res = await fetch(`/api/admin/invites?id=${id}`, { method: 'DELETE' })
    setDeleting(null)
    if (!res.ok) { toast.error('Error al eliminar'); return }
    setTokens(prev => prev.filter(t => t.id !== id))
    toast.success('Invitación eliminada')
  }

  return (
    <div className="space-y-4">
      <Button onClick={generateToken} disabled={loading}>
        {loading ? 'Generando...' : '+ Generar link de invitación'}
      </Button>

      <Table>
        <TableHeader>
          <TableRow className="border-border">
            <TableHead>Token</TableHead>
            <TableHead>Expira</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead></TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tokens.map(t => (
            <TableRow key={t.id} className="border-border">
              <TableCell className="font-mono text-xs text-muted-foreground">{t.token.slice(0, 12)}...</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(t.expiresAt), 'dd/MM/yyyy')}
              </TableCell>
              <TableCell>
                {t.usedBy ? (
                  <Badge variant="secondary" className="text-xs">Usado</Badge>
                ) : t.expiresAt < new Date() ? (
                  <Badge variant="destructive" className="text-xs">Expirado</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-primary border-primary">Disponible</Badge>
                )}
              </TableCell>
              <TableCell>
                {!t.usedBy && t.expiresAt > new Date() && (
                  <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => copyLink(t.token)}>
                    Copiar link
                  </Button>
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(t.id)}
                  disabled={deleting === t.id}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {tokens.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                No hay invitaciones generadas.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
