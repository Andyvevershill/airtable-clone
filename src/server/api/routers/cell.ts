import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { cells } from "@/server/db/schemas";
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
      // Single atomic round trip; relies on the unique index on
      // (row_id, column_id)
      const [result] = await ctx.db
        .insert(cells)
        .values({
          rowId: input.rowId,
          columnId: input.columnId,
          value: input.value,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [cells.rowId, cells.columnId],
          set: { value: input.value, updatedAt: new Date() },
        })
        .returning();

      return result;
    }),
});
