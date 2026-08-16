import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { cells, columns, rows } from "@/server/db/schemas";
import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { db } from "@/server/db";

type Tx = Parameters<Parameters<(typeof db)["transaction"]>[0]>[0];

// Insert the column and backfill one empty cell per existing row entirely in
// the database — one INSERT ... SELECT instead of paging every row through
// the server. IDs are generated in SQL since the JS cuid default is bypassed.
async function createColumnWithCells(
  tx: Tx,
  input: { id?: string; tableId: string; name: string; type: string },
) {
  const [newColumn] = await tx
    .insert(columns)
    .values({
      ...(input.id ? { id: input.id } : {}),
      tableId: input.tableId,
      name: input.name,
      type: input.type,
      position: sql`COALESCE((SELECT MAX(${columns.position}) + 1 FROM ${columns} WHERE ${columns.tableId} = ${input.tableId}), 0)`,
    })
    .returning();

  if (!newColumn) throw new Error("Failed to create column");

  await tx.execute(sql`
    INSERT INTO ${cells} (id, row_id, column_id, value)
    SELECT gen_random_uuid()::text, r.id, ${newColumn.id}, NULL
    FROM ${rows} r
    WHERE r.table_id = ${input.tableId}
    ON CONFLICT DO NOTHING
  `);

  return newColumn;
}

export const columnRouter = createTRPCRouter({
  getColumns: protectedProcedure
    .input(z.object({ tableId: z.string() }))
    .query(async ({ ctx, input }) => {
      const columnArr = await ctx.db.query.columns.findMany({
        where: eq(columns.tableId, input.tableId),
        orderBy: (columns, { asc }) => [asc(columns.position)],
      });

      return columnArr;
    }),

  addColumn: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        tableId: z.string(),
        name: z.string(),
        type: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) =>
        createColumnWithCells(tx, input),
      );
    }),

  addColumnBatched: protectedProcedure
    .input(
      z.object({
        tableId: z.string(),
        name: z.string(),
        type: z.enum(["text", "number"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) =>
        createColumnWithCells(tx, input),
      );
    }),

  deleteColumn: protectedProcedure
    .input(
      z.object({
        columnId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get the column first to know which table it belongs to
      const column = await ctx.db.query.columns.findFirst({
        where: eq(columns.id, input.columnId),
      });

      if (!column) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Column not found",
        });
      }

      // Delete the column
      await ctx.db.delete(columns).where(eq(columns.id, input.columnId));

      //  Return the tableId so the client can invalidate queries
      return {
        success: true,
        tableId: column.tableId,
      };
    }),
});
