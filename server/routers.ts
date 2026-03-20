import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

const ALLOWED_EMAIL = "jcesperanza@neu.edu.ph";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    switchRole: protectedProcedure
      .input(z.object({ role: z.enum(["user", "admin"]) }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Verify user has this role
        if (input.role !== "user" && input.role !== "admin") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid role" });
        }

        // Check if user has permission to switch to this role
        if (input.role === "admin" && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "You don't have permission to switch to admin role" });
        }

        await db.updateUserRole(ctx.user.id, input.role);

        // Return updated user
        const updatedUser = await db.getUserByOpenId(ctx.user.openId);
        return updatedUser;
      }),
  }),

  stats: router({
    get: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        reason: z.string().optional(),
        college: z.string().optional(),
        employeeType: z.enum(["teacher", "staff", "non-employee"]).optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        if (!ctx.user || ctx.user.currentRole !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can view statistics" });
        }

        const logs = await db.getVisitorStats(input);
        const today = new Date();
        const dailyCount = await db.getDailyStats(today);
        const weeklyCount = await db.getWeeklyStats(today);

        return {
          logs,
          dailyCount,
          weeklyCount,
          totalCount: logs.length,
        };
      }),
    daily: protectedProcedure
      .input(z.object({ date: z.date() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user || ctx.user.currentRole !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can view statistics" });
        }
        return db.getDailyStats(input.date);
      }),
    weekly: protectedProcedure
      .input(z.object({ date: z.date() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user || ctx.user.currentRole !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can view statistics" });
        }
        return db.getWeeklyStats(input.date);
      }),
  }),

  visitors: router({
    log: protectedProcedure
      .input(z.object({
        date: z.date(),
        reason: z.string().min(1),
        college: z.string().min(1),
        employeeType: z.enum(["teacher", "staff", "non-employee"]),
      }))
      .mutation(async ({ input }) => {
        return db.createVisitorLog(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
