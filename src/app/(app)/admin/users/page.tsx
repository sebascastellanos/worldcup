import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { mapUser } from '@/lib/db/mappers'
import { redirect } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: userData } = await supabaseAdmin.from('users').select('*').eq('id', authUser.id).maybeSingle()
  const dbUser = userData ? mapUser(userData) : null
  if (dbUser?.role !== 'admin') redirect('/dashboard')

  const { data: rawUsers } = await supabaseAdmin
    .from('users')
    .select('*')
    .order('total_points', { ascending: false })

  const allUsers = (rawUsers ?? []).map(mapUser)

  return (
    <div className="p-6 max-w-[800px] mx-auto">
      <h1 className="text-xl font-bold mb-6">Participantes ({allUsers.length})</h1>
      <Table>
        <TableHeader>
          <TableRow className="border-border">
            <TableHead>Participante</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead className="text-right font-mono">Puntos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allUsers.map(u => (
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
