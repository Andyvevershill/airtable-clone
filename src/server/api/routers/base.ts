import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { bases } from "@/server/db/schemas/table-schemas";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

export const baseRouter = createTRPCRouter({
  // Create a new base
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        icon: z.string().optional(),
        color: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [base] = await ctx.db
        .insert(bases)
        .values({
          name: input.name,
          icon: input.icon,
          color: input.color,
          userId: ctx.session.user.id,
        })
        .returning();

      return base;
    }),

  // List all bases for current user (sorted by most recently accessed)
  list: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select()
      .from(bases)
      .where(eq(bases.userId, ctx.session.user.id))
      .orderBy(desc(bases.lastAccessedAt));
  }),

  // Get a single base by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [base] = await ctx.db
        .select()
        .from(bases)
        .where(eq(bases.id, input.id))
        .limit(1);

      if (!base || base.userId !== ctx.session.user.id) {
        throw new Error("Base not found");
      }

      return base;
    }),

  // Update last accessed timestamp
  updateLastAccessed: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [base] = await ctx.db
        .update(bases)
        .set({ lastAccessedAt: new Date() })
        .where(eq(bases.id, input.id))
        .returning();

      if (!base || base?.userId !== ctx.session.user.id) {
        throw new Error("Base not found");
      }

      return base;
    }),
});
