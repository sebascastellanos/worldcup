'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { User } from '@/lib/db/schema'

export function UsersAdmin({ initialUsers, currentUserId }: { initialUsers: User[], currentUserId: string }) {
  const [users, setUsers] = useState(initialUsers)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(userId: string, name: string) {
    if (!confirm(`¿Eliminar a ${name}? Se borrarán todas sus predicciones.`)) return
    setDeleting(userId)
    const res = await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' })
    setDeleting(null)
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error ?? 'Error al eliminar')
      return
    }
    setUsers(prev => prev.filter(u => u.id !== userId))
    toast.success(`${name} eliminado`)
  }

  return (
    <div className="p-6 max-w-[800px] mx-auto">
      <h1 className="text-xl font-bold mb-6">Participantes ({users.length})</h1>
      <Table>
        <TableHeader>
          <TableRow className="border-border">
            <TableHead>Participante</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead className="text-right font-mono">Puntos</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(u => (
            <TableRow key={u.id} className="border-border">
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="text-xs bg-muted">{u.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{u.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
              <TableCell>
                <Badge variant={u.role === 'admin' ? 'default' : 'outline'} className="text-xs">
                  {u.role}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono font-bold text-primary">
                {u.totalPoints}
              </TableCell>
              <TableCell>
                {u.id !== currentUserId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(u.id, u.name)}
                    disabled={deleting === u.id}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
