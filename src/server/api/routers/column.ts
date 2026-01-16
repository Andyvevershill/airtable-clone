import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { cells, columns, rows } from "@/server/db/schemas";
import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

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
        tableId: z.string(),
        name: z.string(),
        type: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get max position for new column
      const maxPositionResult = await ctx.db.query.columns.findFirst({
        where: eq(columns.tableId, input.tableId),
        orderBy: (columns, { desc }) => [desc(columns.position)],
      });

      const newPosition = (maxPositionResult?.position ?? -1) + 1;

      // Create the column
      const [newColumn] = await ctx.db
        .insert(columns)
        .values({
          tableId: input.tableId,
          name: input.name,
          type: input.type,
          position: newPosition,
        })
        .returning();

      if (!newColumn) throw new Error("Failed to create column");

      // Get ALL existing rows
      const tableRows = await ctx.db.query.rows.findMany({
        where: eq(rows.tableId, input.tableId),
      });

      // Create a cell for EACH row in the new column
      if (tableRows.length > 0) {
        await ctx.db.insert(cells).values(
          tableRows.map((row) => ({
            rowId: row.id,
            columnId: newColumn.id,
            value: null,
          })),
        );
      }

      return newColumn;
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
      // Get max position for new column
      const maxPositionResult = await ctx.db.query.columns.findFirst({
        where: eq(columns.tableId, input.tableId),
        orderBy: (columns, { desc }) => [desc(columns.position)],
      });

      const newPosition = (maxPositionResult?.position ?? -1) + 1;

      // Create the column
      const [newColumn] = await ctx.db
        .insert(columns)
        .values({
          tableId: input.tableId,
          name: input.name,
          type: input.type,
          position: newPosition,
        })
        .returning();

      if (!newColumn) throw new Error("Failed to create column");

      // Get the total row count first
      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(rows)
        .where(eq(rows.tableId, input.tableId));

      const totalRows = countResult[0]?.count ?? 0;

      if (totalRows === 0) {
        return newColumn;
      }

      const batchSize = 1000;
      const batches = Math.ceil(totalRows / batchSize);

      for (let batch = 0; batch < batches; batch++) {
        const offset = batch * batchSize;

        // Fetch rows in batches
        const tableRows = await ctx.db.query.rows.findMany({
          where: eq(rows.tableId, input.tableId),
          orderBy: (rows, { asc }) => [asc(rows.position)],
          limit: batchSize,
          offset: offset,
        });

        // Create cells for this batch
        const cellsToInsert = tableRows.map((row) => ({
          rowId: row.id,
          columnId: newColumn.id,
          value: null,
          updatedAt: null,
        }));

        await ctx.db.insert(cells).values(cellsToInsert);
      }

      return newColumn;
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
