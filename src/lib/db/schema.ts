import {
  pgTable, uuid, text, integer, boolean,
  timestamp, pgEnum, unique
} from 'drizzle-orm/pg-core'

export const roleEnum = pgEnum('role', ['admin', 'participant'])
export const matchStatusEnum = pgEnum('match_status', ['scheduled', 'live', 'finished'])
export const predTypeEnum = pgEnum('pred_type', ['home_win', 'draw', 'away_win', 'exact_score'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  role: roleEnum('role').default('participant').notNull(),
  avatarUrl: text('avatar_url'),
  totalPoints: integer('total_points').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const matches = pgTable('matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  externalId: text('external_id').unique(),
  homeTeam: text('home_team').notNull(),
  awayTeam: text('away_team').notNull(),
  homeFlag: text('home_flag'),
  awayFlag: text('away_flag'),
  matchDate: timestamp('match_date', { withTimezone: true }).notNull(),
  stage: text('stage').notNull(),
  status: matchStatusEnum('status').default('scheduled').notNull(),
  homeScore: integer('home_score'),
  awayScore: integer('away_score'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const predictions = pgTable('predictions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  matchId: uuid('match_id').references(() => matches.id, { onDelete: 'cascade' }).notNull(),
  predType: predTypeEnum('pred_type').notNull(),
  predHome: integer('pred_home'),
  predAway: integer('pred_away'),
  pointsEarned: integer('points_earned').default(0).notNull(),
  locked: boolean('locked').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [unique().on(t.userId, t.matchId)])

export const inviteTokens = pgTable('invite_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  token: text('token').unique().notNull(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  usedBy: uuid('used_by').references(() => users.id),
  usedAt: timestamp('used_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type User = typeof users.$inferSelect
export type Match = typeof matches.$inferSelect
export type Prediction = typeof predictions.$inferSelect
export type InviteToken = typeof inviteTokens.$inferSelect
export type PredType = typeof predTypeEnum.enumValues[number]
export type MatchStatus = typeof matchStatusEnum.enumValues[number]
