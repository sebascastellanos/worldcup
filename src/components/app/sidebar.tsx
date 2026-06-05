'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ListChecks, Trophy, Settings, Shield, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/predictions', label: 'Predicciones', icon: ListChecks },
  { href: '/leaderboard', label: 'Ranking', icon: Trophy },
]

const adminItems = [
  { href: '/admin/matches', label: 'Partidos', icon: Settings },
  { href: '/admin/invites', label: 'Invitaciones', icon: Shield },
  { href: '/admin/users', label: 'Usuarios', icon: Shield },
]

interface SidebarProps {
  isAdmin: boolean
  userName: string
  userPoints: number
}

export function Sidebar({ isAdmin, userName, userPoints }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-[220px] shrink-0 flex flex-col h-screen border-r border-border bg-card sticky top-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-border">
        <div className="text-lg font-bold text-primary">⚽ Mundial 2026</div>
        <div className="text-xs text-muted-foreground mt-0.5">Polla</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              pathname === href
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Admin
            </div>
            {adminItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  pathname === href
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-border space-y-3">
        <div>
          <div className="text-sm font-medium truncate">{userName}</div>
          <div className="text-xs text-primary font-mono mt-0.5">{userPoints} pts</div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
