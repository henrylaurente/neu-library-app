import { eq, and, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, InsertVisitorLog, users, visitorLogs } from "../drizzle/schema";
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
    const values: any = {
      openId: user.openId,
      email: user.email || "unknown@example.com",
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "loginMethod", "googleId"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.email !== undefined) {
      values.email = user.email;
      updateSet.email = user.email;
    }

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

    if (user.currentRole !== undefined) {
      values.currentRole = user.currentRole;
      updateSet.currentRole = user.currentRole;
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

export async function getUserByGoogleId(googleId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserRole(userId: number, currentRole: "user" | "admin") {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user: database not available");
    return undefined;
  }

  const result = await db.update(users).set({ currentRole }).where(eq(users.id, userId));
  return result;
}

export async function createVisitorLog(log: InsertVisitorLog) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create visitor log: database not available");
    return undefined;
  }

  const result = await db.insert(visitorLogs).values(log);
  return result;
}

export async function getVisitorStats(filters?: {
  startDate?: Date;
  endDate?: Date;
  reason?: string;
  college?: string;
  employeeType?: string;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get visitor stats: database not available");
    return [];
  }

  const conditions = [];

  if (filters?.startDate) {
    conditions.push(gte(visitorLogs.date, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(visitorLogs.date, filters.endDate));
  }
  if (filters?.reason) {
    conditions.push(eq(visitorLogs.reason, filters.reason));
  }
  if (filters?.college) {
    conditions.push(eq(visitorLogs.college, filters.college));
  }
  if (filters?.employeeType) {
    conditions.push(eq(visitorLogs.employeeType, filters.employeeType as any));
  }

  if (conditions.length > 0) {
    const result = await db.select().from(visitorLogs).where(and(...conditions));
    return result;
  }

  const result = await db.select().from(visitorLogs);
  return result;
}

export async function getDailyStats(date: Date) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get daily stats: database not available");
    return 0;
  }

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(visitorLogs)
    .where(and(gte(visitorLogs.date, startOfDay), lte(visitorLogs.date, endOfDay)));

  return result[0]?.count || 0;
}

export async function getWeeklyStats(date: Date) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get weekly stats: database not available");
    return 0;
  }

  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(visitorLogs)
    .where(and(gte(visitorLogs.date, startOfWeek), lte(visitorLogs.date, endOfWeek)));

  return result[0]?.count || 0;
}
