import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { mapPrediction, mapMatch } from '@/lib/db/mappers'

export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { userId } = await params

  const { data: rawPreds } = await supabaseAdmin
    .from('predictions')
    .select('*, matches(*)')
    .eq('user_id', userId)
    .order('matches(match_date)', { ascending: true })

  const predictions = (rawPreds ?? []).map(r => ({
    ...mapPrediction(r),
    match: r.matches ? mapMatch(r.matches) : null,
  }))

  return NextResponse.json({ predictions })
}
