import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { rows } from "@/server/db/schemas/bases";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

export const rowsRouter = createTRPCRouter({
  getRowsWindow: protectedProcedure
    .input(
      z.object({
        tableId: z.string(),
        offset: z.number().default(0),
        limit: z.number().default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tableRows = await ctx.db.query.rows.findMany({
        where: eq(rows.tableId, input.tableId),
        orderBy: (rows, { asc }) => [asc(rows.position)],
        limit: input.limit,
        offset: input.offset,
        with: {
          cells: true,
        },
      });

      return tableRows;
    }),

  addRow: protectedProcedure
    .input(z.object({ tableId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const maxPositionResult = await ctx.db
        .select({ maxPosition: sql<number>`max(position)` })
        .from(rows)
        .where(eq(rows.tableId, input.tableId));

      const maxPosition = maxPositionResult[0]?.maxPosition ?? -1;

      const [newRow] = await ctx.db
        .insert(rows)
        .values({
          tableId: input.tableId,
          position: maxPosition + 1,
        })
        .returning();

      return newRow;
    }),
});
