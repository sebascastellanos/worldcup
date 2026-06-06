import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { mapUser } from '@/lib/db/mappers'
import { Sidebar } from '@/components/app/sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  let dbUser = null
  if (authUser) {
    const { data } = await supabaseAdmin.from('users').select('*').eq('id', authUser.id).maybeSingle()
    dbUser = data ? mapUser(data) : null
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        isAdmin={dbUser?.role === 'admin'}
        userName={dbUser?.name ?? 'Invitado'}
        userPoints={dbUser?.totalPoints ?? 0}
      />
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        {children}
      </main>
    </div>
  )
}
