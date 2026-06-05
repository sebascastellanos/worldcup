import { supabaseAdmin } from '@/lib/supabase/admin'
import { mapMatch } from '@/lib/db/mappers'
import { fetchFromSportsApi } from './client'
import { recalcularPuntosPartido } from '@/lib/points/updater'

interface ApiMatch {
  id: number
  homeTeam: { name: string; crest: string }
  awayTeam: { name: string; crest: string }
  utcDate: string
  stage: string
  group: string | null
  status: string
  score: {
    fullTime: { home: number | null; away: number | null }
  }
}

function mapStatus(apiStatus: string): 'scheduled' | 'live' | 'finished' {
  if (['IN_PLAY', 'PAUSED', 'HALFTIME'].includes(apiStatus)) return 'live'
  if (['FINISHED', 'AWARDED'].includes(apiStatus)) return 'finished'
  return 'scheduled'
}

// For GROUP_STAGE matches use the specific group label (GROUP_A, GROUP_B, ...)
function resolveStage(apiMatch: ApiMatch): string {
  if (apiMatch.stage === 'GROUP_STAGE' && apiMatch.group) return apiMatch.group
  return apiMatch.stage
}

export async function syncResults(): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = []
  let synced = 0

  try {
    const data = await fetchFromSportsApi('/competitions/2000/matches')
    const apiMatches: ApiMatch[] = data.matches ?? []

    for (const apiMatch of apiMatches) {
      try {
        const externalId = String(apiMatch.id)
        const status = mapStatus(apiMatch.status)
        const homeScore = apiMatch.score.fullTime.home
        const awayScore = apiMatch.score.fullTime.away
        const stage = resolveStage(apiMatch)

        const { data: existingData } = await supabaseAdmin
          .from('matches')
          .select('*')
          .eq('external_id', externalId)
          .maybeSingle()

        if (existingData) {
          const existing = mapMatch(existingData)
          const statusChanged = existing.status !== status
          const scoreChanged = existing.homeScore !== homeScore || existing.awayScore !== awayScore

          if (statusChanged || scoreChanged) {
            await supabaseAdmin
              .from('matches')
              .update({
                status,
                home_score: homeScore,
                away_score: awayScore,
                updated_at: new Date().toISOString(),
              })
              .eq('external_id', externalId)

            if (status === 'live' || status === 'finished') {
              await supabaseAdmin.from('predictions').update({ locked: true }).eq('match_id', existing.id)
            }

            if (status === 'finished' && homeScore !== null && awayScore !== null) {
              await recalcularPuntosPartido(existing.id, { homeScore, awayScore })
            }
            synced++
          }
        } else {
          await supabaseAdmin.from('matches').insert({
            external_id: externalId,
            home_team: apiMatch.homeTeam.name,
            away_team: apiMatch.awayTeam.name,
            home_flag: apiMatch.homeTeam.crest,
            away_flag: apiMatch.awayTeam.crest,
            match_date: new Date(apiMatch.utcDate).toISOString(),
            stage,
            status,
            home_score: homeScore,
            away_score: awayScore,
          })
          synced++
        }
      } catch (err) {
        errors.push(`Partido ${apiMatch.id}: ${String(err)}`)
      }
    }
  } catch (err) {
    errors.push(`Error general: ${String(err)}`)
  }

  return { synced, errors }
}
