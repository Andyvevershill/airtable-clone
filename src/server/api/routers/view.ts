import { checkTableOwner, checkViewOwner } from "@/server/api/ownership";
import { views } from "@/server/db/schemas";
import {
  viewFilteringUpdateSchema,
  viewHiddenUpdateSchema,
  viewSortingUpdateSchema,
} from "@/types/view";
import { and, eq } from "drizzle-orm";
import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const viewRouter = createTRPCRouter({
  updateViewFilters: protectedProcedure
    .input(viewFilteringUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      await checkViewOwner(ctx, input.id);

      return await ctx.db
        .update(views)
        .set({ filters: input.filters })
        .where(eq(views.id, input.id));
    }),

  updateViewSorting: protectedProcedure
    .input(viewSortingUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      await checkViewOwner(ctx, input.id);

      return await ctx.db
        .update(views)
        .set({ sorting: input.sorting })
        .where(eq(views.id, input.id));
    }),

  updateViewHidden: protectedProcedure
    .input(viewHiddenUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      await checkViewOwner(ctx, input.id);

      return await ctx.db
        .update(views)
        .set({ hidden: input.hidden })
        .where(eq(views.id, input.id));
    }),

  toggleFavourite: protectedProcedure
    .input(z.object({ id: z.string(), isFavourite: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await checkViewOwner(ctx, input.id);

      return await ctx.db
        .update(views)
        .set({ isFavourite: !input.isFavourite })
        .where(eq(views.id, input.id));
    }),

  setActive: protectedProcedure
    .input(z.object({ id: z.string(), tableId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkTableOwner(ctx, input.tableId);

      // turn the rest off first - only one active view allowed per table (unique index)
      await ctx.db.transaction(async (tx) => {
        await tx
          .update(views)
          .set({ isActive: false })
          .where(eq(views.tableId, input.tableId));

        await tx
          .update(views)
          .set({ isActive: true })
          .where(and(eq(views.id, input.id), eq(views.tableId, input.tableId)));
      });
    }),

  deleteById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkViewOwner(ctx, input.id);

      // 1. Get the view being deleted
      const currentView = await ctx.db.query.views.findFirst({
        where: eq(views.id, input.id),
      });

      if (!currentView) {
        throw new Error("View not found");
      }

      // 2. Get all views for the SAME TABLE
      const allViews = await ctx.db.query.views.findMany({
        where: eq(views.tableId, currentView.tableId),
        orderBy: (views, { asc }) => [asc(views.createdAt)],
      });

      if (allViews.length === 1) {
        throw new Error("Cannot delete last view for this table");
      }

      const nextView = currentView.isActive
        ? allViews.find((v) => v.id !== currentView.id)
        : undefined;

      // 3. Delete the view, then activate another one if it was the active view
      // (in that order - two active views at once breaks the unique index)
      await ctx.db.transaction(async (tx) => {
        await tx.delete(views).where(eq(views.id, input.id));

        if (nextView) {
          await tx
            .update(views)
            .set({ isActive: true })
            .where(eq(views.id, nextView.id));
        }
      });

      return { success: true, nextViewId: nextView?.id ?? null };
    }),

  updateName: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkViewOwner(ctx, input.id);

      return await ctx.db
        .update(views)
        .set({ name: input.name })
        .where(eq(views.id, input.id));
    }),

  duplicateView: protectedProcedure
    .input(z.object({ id: z.string(), newId: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkViewOwner(ctx, input.id);

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
    .input(
      z.object({
        name: z.string(),
        tableId: z.string(),
        viewId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await checkTableOwner(ctx, input.tableId);

      return await ctx.db.transaction(async (tx) => {
        // remove active state for the rest
        await tx
          .update(views)
          .set({ isActive: false })
          .where(eq(views.tableId, input.tableId));

        // create and set this one as active
        return await tx.insert(views).values({
          id: input.viewId,
          name: input.name,
          tableId: input.tableId,
          isFavourite: false,
          isActive: true,
        });
      });
    }),
});
