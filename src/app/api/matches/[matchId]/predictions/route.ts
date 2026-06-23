import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(_req: Request, { params }: { params: Promise<{ matchId: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { matchId } = await params

  const { data } = await supabaseAdmin
    .from('predictions')
    .select('pred_type, pred_home, pred_away, points_earned, users(name)')
    .eq('match_id', matchId)

  const predictions = (data ?? []).map(r => ({
    userName: (r.users as any)?.name ?? 'Desconocido',
    predType: r.pred_type,
    predHome: r.pred_home,
    predAway: r.pred_away,
    pointsEarned: r.points_earned,
  }))

  return NextResponse.json({ predictions })
}
