import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { mapMatch, mapPrediction } from '@/lib/db/mappers'
import { GroupsAccordion } from '@/components/app/groups-accordion'
import { RulesModal } from '@/components/app/rules-modal'
import { ConfettiManager } from '@/components/app/confetti-manager'
import { UpcomingBanner } from '@/components/app/upcoming-banner'
import { PatchNote } from '@/components/app/patch-note'

export default async function PredictionsPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  const { data: rawMatches } = await supabaseAdmin
    .from('matches')
    .select('*')
    .order('match_date', { ascending: true })

  const allMatches = (rawMatches ?? []).map(mapMatch)

  const userPredictions = authUser
    ? await supabaseAdmin
        .from('predictions')
        .select('*')
        .eq('user_id', authUser.id)
        .then(({ data }) => (data ?? []).map(mapPrediction))
    : []

  const predMap = new Map(userPredictions.map(p => [p.matchId, p]))

  return (
    <div className="p-3 md:p-6 max-w-[1400px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Predicciones</h1>
          <RulesModal />
        </div>
        {allMatches.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {predMap.size} de {allMatches.length} predicciones hechas
          </span>
        )}
      </div>

      <PatchNote />
      <UpcomingBanner matches={allMatches} predMap={predMap} />

      {authUser && (
        <ConfettiManager
          userId={authUser.id}
          predictions={userPredictions.map(p => ({ id: p.id, pointsEarned: p.pointsEarned }))}
        />
      )}

      {allMatches.length === 0 ? (
        <p className="text-muted-foreground">Aún no hay partidos cargados.</p>
      ) : (
        <GroupsAccordion matches={allMatches} predMap={predMap} />
      )}
    </div>
  )
}
