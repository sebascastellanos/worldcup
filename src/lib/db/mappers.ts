import type { Match, User, Prediction, InviteToken } from './schema'

export function mapMatch(r: Record<string, any>): Match {
  return {
    id: r.id,
    externalId: r.external_id,
    homeTeam: r.home_team,
    awayTeam: r.away_team,
    homeFlag: r.home_flag,
    awayFlag: r.away_flag,
    matchDate: new Date(r.match_date),
    stage: r.stage,
    status: r.status,
    homeScore: r.home_score,
    awayScore: r.away_score,
    updatedAt: new Date(r.updated_at),
  }
}

export function mapUser(r: Record<string, any>): User {
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    role: r.role,
    avatarUrl: r.avatar_url,
    totalPoints: r.total_points,
    createdAt: new Date(r.created_at),
  }
}

export function mapPrediction(r: Record<string, any>): Prediction {
  return {
    id: r.id,
    userId: r.user_id,
    matchId: r.match_id,
    predType: r.pred_type,
    predHome: r.pred_home,
    predAway: r.pred_away,
    pointsEarned: r.points_earned,
    locked: r.locked,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  }
}

export function mapInviteToken(r: Record<string, any>): InviteToken {
  return {
    id: r.id,
    token: r.token,
    createdBy: r.created_by,
    usedBy: r.used_by,
    usedAt: r.used_at ? new Date(r.used_at) : null,
    expiresAt: new Date(r.expires_at),
    createdAt: new Date(r.created_at),
  }
}
