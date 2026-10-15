import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const projects = sqliteTable('projects', {
 id: text('id').primaryKey(),
 data: text('data').notNull(),
 revision: integer('revision').notNull().default(1),
 updatedAt: text('updated_at').notNull(),
 updatedBy: text('updated_by').notNull(),
 deletedAt: text('deleted_at')
});
export const authSessions=sqliteTable('auth_sessions',{
 id:text('id').primaryKey(),accessToken:text('access_token').notNull(),refreshToken:text('refresh_token').notNull(),expiresAt:integer('expires_at').notNull(),userId:text('user_id').notNull().default(''),memberRevision:integer('member_revision').notNull().default(0)
});
export const authAttempts=sqliteTable('auth_attempts',{
 id:text('id').primaryKey(),period:integer('period').notNull(),attempts:integer('attempts').notNull()
});
export const members=sqliteTable('members',{
 id:text('id').primaryKey(),email:text('email').notNull(),status:text('status').notNull().default('pending'),
 requestedAt:text('requested_at').notNull(),lastLogin:text('last_login'),reviewedAt:text('reviewed_at'),reviewedBy:text('reviewed_by'),revision:integer('revision').notNull().default(1)
});
export const activity=sqliteTable('activity',{
 id:integer('id').primaryKey({autoIncrement:true}),actorId:text('actor_id').notNull(),email:text('email').notNull(),action:text('action').notNull(),target:text('target').notNull(),createdAt:text('created_at').notNull()
});
export const monitoringRecords=sqliteTable('monitoring_records',{
 id:text('id').primaryKey(),data:text('data').notNull(),revision:integer('revision').notNull().default(1),updatedAt:text('updated_at').notNull(),updatedBy:text('updated_by').notNull()
});
export const progressRecords=sqliteTable('progress_records',{
 id:text('id').primaryKey(),data:text('data').notNull(),revision:integer('revision').notNull().default(1),updatedAt:text('updated_at').notNull(),updatedBy:text('updated_by').notNull()
});
