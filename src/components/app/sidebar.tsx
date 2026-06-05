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
    <aside className="w-[220px] shrink-0 flex flex-col h-screen sticky top-0 bg-[#0d1b2e] text-slate-100">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="text-base font-black tracking-tight text-white">⚽ Mundial 2026</div>
        <div className="text-xs text-slate-400 mt-0.5 font-medium">Polla Familiar</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-green-500/20 text-green-400'
                : 'text-slate-400 hover:text-white hover:bg-white/8'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="pt-5 pb-1.5 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Admin
            </div>
            {adminItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  pathname === href
                    ? 'bg-green-500/20 text-green-400'
                    : 'text-slate-400 hover:text-white hover:bg-white/8'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-white/10 space-y-3">
        <div>
          <div className="text-sm font-semibold text-white truncate">{userName}</div>
          <div className="text-xs text-green-400 font-mono mt-0.5 font-bold">{userPoints} pts</div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/8 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
