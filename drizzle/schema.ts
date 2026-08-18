import { int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const cinemaSourceIngestions = mysqlTable(
  "cinema_source_ingestions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    projectId: varchar("projectId", { length: 96 }).notNull(),
    sourceName: varchar("sourceName", { length: 255 }).notNull(),
    sourceType: varchar("sourceType", { length: 32 }).notNull(),
    rightsStatus: varchar("rightsStatus", { length: 32 }).notNull(),
    storageKey: varchar("storageKey", { length: 512 }),
    storageUrl: varchar("storageUrl", { length: 512 }),
    sizeBytes: int("sizeBytes"),
    status: mysqlEnum("status", ["selected", "uploaded", "ready_for_analysis", "analysed", "failed"]).notNull().default("selected"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userProjectUnique: uniqueIndex("cinema_source_ingestions_user_project_unique").on(table.userId, table.projectId),
  })
);

export type CinemaSourceIngestion = typeof cinemaSourceIngestions.$inferSelect;
export type InsertCinemaSourceIngestion = typeof cinemaSourceIngestions.$inferInsert;
