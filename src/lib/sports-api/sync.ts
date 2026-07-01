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
    winner: string | null
    duration: string | null
    fullTime: { home: number | null; away: number | null }
    // regularTime = 90' result (knockout matches only; group stage only has fullTime)
    // fullTime in football-data.org v4 = cumulative including penalty shootout goals
    regularTime: { home: number | null; away: number | null } | null
    extraTime: { home: number | null; away: number | null } | null
    penalties: { home: number | null; away: number | null } | null
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

export async function syncResults(source: 'cron' | 'admin' = 'cron'): Promise<{ synced: number; locked: number; errors: string[] }> {
  const errors: string[] = []
  let synced = 0
  let locked = 0

  // Lock predictions for matches starting within the next 5 min — time-based, no API needed.
  // This guarantees bets are closed even if the API hasn't flipped the match to 'live' yet.
  try {
    const lockCutoff = new Date(Date.now() + 5 * 60 * 1000).toISOString()
    const { data: upcoming } = await supabaseAdmin
      .from('matches')
      .select('id')
      .eq('status', 'scheduled')
      .lte('match_date', lockCutoff)

    for (const match of (upcoming ?? [])) {
      const { data: updated } = await supabaseAdmin
        .from('predictions')
        .update({ locked: true })
        .eq('match_id', match.id)
        .eq('locked', false)
        .select('id')
      locked += (updated ?? []).length
    }
  } catch (err) {
    errors.push(`Error cerrando pollas: ${String(err)}`)
  }

  try {
    // 1 sola query para traer todo de la API y todo de la BD
    const [apiData, { data: existingData }] = await Promise.all([
      fetchFromSportsApi('/competitions/2000/matches'),
      supabaseAdmin.from('matches').select('*'),
    ])

    const apiMatches: ApiMatch[] = apiData.matches ?? []

    // Mapa en memoria: external_id → match. Cero queries adicionales para buscar.
    const existingMap = new Map(
      (existingData ?? []).map(r => [r.external_id, mapMatch(r)])
    )

    const toInsert: object[] = []
    const toUpdate: { id: string; externalId: string; changes: object; lockPreds: boolean; recalculate: { homeScore: number; awayScore: number; winner?: string | null } | null }[] = []

    for (const apiMatch of apiMatches) {
      try {
        const externalId = String(apiMatch.id)
        const status = mapStatus(apiMatch.status)
        // Derive 90' score (for exact_score checks):
        // 1. regularTime if populated (penalty matches)
        // 2. fullTime minus extraTime goals if ET was played but regularTime is null (API inconsistency)
        // 3. fullTime alone for normal REGULAR matches
        const rt = apiMatch.score.regularTime
        const et0 = apiMatch.score.extraTime
        const ft = apiMatch.score.fullTime
        let homeScore: number | null
        let awayScore: number | null
        if (rt?.home != null && rt?.away != null) {
          homeScore = rt.home
          awayScore = rt.away
        } else if (et0?.home != null && et0?.away != null && (et0.home > 0 || et0.away > 0)) {
          // ET was played (has goals) but regularTime not populated — infer 90' by subtraction
          homeScore = (ft.home ?? 0) - et0.home
          awayScore = (ft.away ?? 0) - et0.away
        } else {
          homeScore = ft.home
          awayScore = ft.away
        }
        const stage = resolveStage(apiMatch)
        const existing = existingMap.get(externalId)

        // winner = result at 120min for knockout (ignores penalties by design)
        // null for group stage or knockout decided in 90min (calculator uses fullTime scores)
        const et = apiMatch.score.extraTime
        const winner = (et && et.home !== null && et.away !== null)
          ? (et.home > et.away ? 'HOME_TEAM' : et.away > et.home ? 'AWAY_TEAM' : 'DRAW')
          : null

        if (!existing) {
          toInsert.push({
            external_id: externalId,
            home_team: apiMatch.homeTeam.name || 'Por definir',
            away_team: apiMatch.awayTeam.name || 'Por definir',
            home_flag: apiMatch.homeTeam.crest || null,
            away_flag: apiMatch.awayTeam.crest || null,
            match_date: new Date(apiMatch.utcDate).toISOString(),
            stage, status, winner,
            home_score: homeScore,
            away_score: awayScore,
          })
        } else {
          // Preserve existing scores if API returns null — never overwrite a real result with null
          const effectiveHome = homeScore ?? existing.homeScore
          const effectiveAway = awayScore ?? existing.awayScore

          const statusChanged = existing.status !== status
          const scoreChanged = existing.homeScore !== effectiveHome || existing.awayScore !== effectiveAway
          const effectiveHomeName = apiMatch.homeTeam.name || existing.homeTeam
          const effectiveAwayName = apiMatch.awayTeam.name || existing.awayTeam
          const teamsChanged = existing.homeTeam !== effectiveHomeName || existing.awayTeam !== effectiveAwayName
          if (statusChanged || scoreChanged || teamsChanged) {
            toUpdate.push({
              id: existing.id,
              externalId,
              changes: { status, home_team: effectiveHomeName, away_team: effectiveAwayName, home_flag: apiMatch.homeTeam.crest || existing.homeFlag, away_flag: apiMatch.awayTeam.crest || existing.awayFlag, home_score: effectiveHome, away_score: effectiveAway, winner, updated_at: new Date().toISOString() },
              lockPreds: status === 'live' || status === 'finished',
              recalculate: status === 'finished' && effectiveHome !== null && effectiveAway !== null
                ? { homeScore: effectiveHome!, awayScore: effectiveAway!, winner }
                : null,
            })
          }
        }
      } catch (err) {
        errors.push(`Partido ${apiMatch.id}: ${String(err)}`)
      }
    }

    // Bulk insert de partidos nuevos (1 query)
    if (toInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin.from('matches').insert(toInsert)
      if (insertError) {
        errors.push(`Error insertando partidos nuevos: ${insertError.message}`)
      } else {
        synced += toInsert.length
      }
    }

    // Updates solo de los partidos que cambiaron (normalmente 0–3 por sync)
    for (const { id, changes, lockPreds, recalculate } of toUpdate) {
      await supabaseAdmin.from('matches').update(changes).eq('id', id)
      if (lockPreds) {
        await supabaseAdmin.from('predictions').update({ locked: true }).eq('match_id', id)
      }
      if (recalculate) {
        await recalcularPuntosPartido(id, recalculate)
      }
      synced++
    }
  } catch (err) {
    errors.push(`Error general: ${String(err)}`)
  }

  await supabaseAdmin.from('sync_logs').insert({ synced, locked, errors, source })

  return { synced, locked, errors }
}
