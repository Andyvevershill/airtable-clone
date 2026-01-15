import { views } from "@/server/db/schemas";
import { viewInputSchema } from "@/types/view";
import { eq } from "drizzle-orm";
import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const viewRouter = createTRPCRouter({
  updateView: protectedProcedure
    .input(viewInputSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .update(views)
        .set({
          id: input.id,
          name: input.name,
          filters: input.filters,
          sorting: input.sorting,
          hidden: input.hidden,
        })
        .where(eq(views.id, input.id));
    }),

  toggleFavourite: protectedProcedure
    .input(z.object({ id: z.string(), isFavourite: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .update(views)
        .set({ isFavourite: input.isFavourite })
        .where(eq(views.id, input.id));
    }),

  deleteById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.delete(views).where(eq(views.id, input.id));
    }),

  updateName: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .update(views)
        .set({ name: input.name })
        .where(eq(views.id, input.id));
    }),

  duplicateView: protectedProcedure
    .input(z.object({ id: z.string(), newId: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const view = await ctx.db.query.views.findFirst({
        where: eq(views.id, input.id),
      });

      if (!view) {
        throw new Error("View not found");
      }

      return await ctx.db.insert(views).values({
        id: input.newId,
        tableId: view.tableId,
        name: input.name,
        filters: view.filters,
        sorting: view.sorting,
        hidden: view.hidden,
        isFavourite: false,
      });
    }),

  createView: protectedProcedure
    .input(z.object({ name: z.string(), tableId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.insert(views).values({
        name: input.name,
        tableId: input.tableId,
        isFavourite: false,
      });
    }),
});
