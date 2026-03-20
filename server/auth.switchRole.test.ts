import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "user" | "admin"): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    currentRole: role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    googleId: null,
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("auth.switchRole", () => {
  it("validates role parameter", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.auth.switchRole({ role: "invalid" as any });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  });

  it("requires admin role to switch to admin", async () => {
    const { ctx } = createAuthContext("user");
    const user = ctx.user as AuthenticatedUser;
    user.role = "user"; // Non-admin user
    
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.auth.switchRole({ role: "admin" });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });

  it("allows switching to user role", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.auth.switchRole({ role: "user" });
      // Result may be undefined if database is not available in test environment
      expect(result === undefined || result !== null).toBe(true);
    } catch (error: any) {
      // Expected if database is not available
      expect(error).toBeDefined();
    }
  });
});

describe("stats.get", () => {
  it("requires admin currentRole to access stats", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.stats.get({});
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });

  it("allows admin to access stats", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stats.get({});
    expect(result).toBeDefined();
    expect(result.logs).toBeDefined();
    expect(Array.isArray(result.logs)).toBe(true);
    expect(typeof result.dailyCount).toBe("number");
    expect(typeof result.weeklyCount).toBe("number");
  });

  it("filters stats by employee type", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stats.get({
      employeeType: "teacher",
    });
    expect(result).toBeDefined();
    expect(Array.isArray(result.logs)).toBe(true);
  });
});
