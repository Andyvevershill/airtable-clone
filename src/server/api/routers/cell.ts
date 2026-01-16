import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { cells } from "@/server/db/schemas";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const cellRouter = createTRPCRouter({
  upsertCell: protectedProcedure
    .input(
      z.object({
        rowId: z.string(),
        columnId: z.string(),
        value: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingCell = await ctx.db.query.cells.findFirst({
        where: and(
          eq(cells.rowId, input.rowId),
          eq(cells.columnId, input.columnId),
        ),
      });

      if (existingCell) {
        const [result] = await ctx.db
          .update(cells)
          .set({
            value: input.value,
            updatedAt: new Date(),
          })
          .where(eq(cells.id, existingCell.id))
          .returning();

        return result;
      } else {
        const [result] = await ctx.db
          .insert(cells)
          .values({
            rowId: input.rowId,
            columnId: input.columnId,
            value: input.value,
            updatedAt: new Date(),
          })
          .returning();

        return result;
      }
    }),
});
