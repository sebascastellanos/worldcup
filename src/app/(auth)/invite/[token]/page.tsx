import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { mapInviteToken } from '@/lib/db/mappers'
import { InviteForm } from './invite-form'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const { data } = await supabaseAdmin
    .from('invite_tokens')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (!data) notFound()
  const invite = mapInviteToken(data)

  if (invite.usedBy) return (
    <div className="text-center space-y-2">
      <p className="text-destructive font-medium">Este link ya fue usado.</p>
      <p className="text-muted-foreground text-sm">Pide al admin que genere uno nuevo.</p>
    </div>
  )
  if (invite.expiresAt < new Date()) return (
    <div className="text-center space-y-2">
      <p className="text-destructive font-medium">Este link expiró.</p>
      <p className="text-muted-foreground text-sm">Pide al admin que genere uno nuevo.</p>
    </div>
  )

  return <InviteForm token={token} />
}
