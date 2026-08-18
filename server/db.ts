import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { cinemaCustomTemplates, cinemaSourceIngestions, InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function upsertCinemaSourceIngestion(input: {
  userId: number;
  projectId: string;
  sourceName: string;
  sourceType: string;
  rightsStatus: string;
  status: "selected" | "uploaded" | "ready_for_analysis" | "analysed" | "failed";
  storageKey?: string;
  storageUrl?: string;
  sizeBytes?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable. Source ingestion cannot be persisted.");

  await db.insert(cinemaSourceIngestions).values(input).onDuplicateKeyUpdate({
    set: {
      sourceName: input.sourceName,
      sourceType: input.sourceType,
      rightsStatus: input.rightsStatus,
      status: input.status,
      storageKey: input.storageKey ?? null,
      storageUrl: input.storageUrl ?? null,
      sizeBytes: input.sizeBytes ?? null,
    },
  });

  const records = await db.select().from(cinemaSourceIngestions).where(and(eq(cinemaSourceIngestions.userId, input.userId), eq(cinemaSourceIngestions.projectId, input.projectId))).limit(1);
  return records[0];
}

export async function markCinemaSourceReady(userId: number, projectId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable. Source ingestion cannot be persisted.");
  const records = await db.select().from(cinemaSourceIngestions).where(and(eq(cinemaSourceIngestions.userId, userId), eq(cinemaSourceIngestions.projectId, projectId))).limit(1);
  const source = records[0];
  if (!source?.storageKey || !source.storageUrl) throw new Error("Upload source material before marking it ready for analysis.");

  await db.update(cinemaSourceIngestions).set({ status: "ready_for_analysis" }).where(eq(cinemaSourceIngestions.id, source.id));
  return { ...source, status: "ready_for_analysis" as const };
}

export async function upsertCinemaCustomTemplate(input: { userId: number; projectId: string; templateId: string; name: string; templateJson: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable. Custom templates cannot be persisted.");
  await db.insert(cinemaCustomTemplates).values(input).onDuplicateKeyUpdate({ set: { name: input.name, templateJson: input.templateJson } });
  const records = await db.select().from(cinemaCustomTemplates).where(and(eq(cinemaCustomTemplates.userId, input.userId), eq(cinemaCustomTemplates.projectId, input.projectId), eq(cinemaCustomTemplates.templateId, input.templateId))).limit(1);
  return records[0];
}

export async function listCinemaCustomTemplates(userId: number, projectId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable. Custom templates cannot be loaded.");
  return db.select().from(cinemaCustomTemplates).where(and(eq(cinemaCustomTemplates.userId, userId), eq(cinemaCustomTemplates.projectId, projectId)));
}

export async function deleteCinemaCustomTemplate(userId: number, projectId: string, templateId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable. Custom templates cannot be deleted.");
  await db.delete(cinemaCustomTemplates).where(and(eq(cinemaCustomTemplates.userId, userId), eq(cinemaCustomTemplates.projectId, projectId), eq(cinemaCustomTemplates.templateId, templateId)));
  return { success: true } as const;
}
