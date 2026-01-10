import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { cells, columns, rows } from "@/server/db/schemas/bases";
import { faker } from "@faker-js/faker";
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

  getRowsInfinite: protectedProcedure
    .input(
      z.object({
        tableId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.number().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const offset = input.cursor ?? 0;

      const tableRows = await ctx.db.query.rows.findMany({
        where: eq(rows.tableId, input.tableId),
        orderBy: (rows, { asc }) => [asc(rows.position)],
        limit: input.limit,
        offset: offset,
        with: {
          cells: true,
        },
      });

      return {
        items: tableRows,
        nextCursor:
          tableRows.length === input.limit ? offset + input.limit : undefined,
      };
    }),

  getRowCount: protectedProcedure
    .input(z.object({ tableId: z.string() }))
    .query(async ({ ctx, input }) => {
      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(rows)
        .where(eq(rows.tableId, input.tableId));

      return countResult[0]?.count ?? 0;
    }),

  addRow: protectedProcedure
    .input(z.object({ tableId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get max position for new row
      const maxPositionResult = await ctx.db
        .select({ maxPosition: sql<number>`max(position)` })
        .from(rows)
        .where(eq(rows.tableId, input.tableId));

      const maxPosition = maxPositionResult[0]?.maxPosition ?? -1;

      // Get all columns for this table
      const tableColumns = await ctx.db.query.columns.findMany({
        where: eq(columns.tableId, input.tableId),
        orderBy: (columns, { asc }) => [asc(columns.position)],
      });

      // Create the row
      const [newRow] = await ctx.db
        .insert(rows)
        .values({
          tableId: input.tableId,
          position: maxPosition + 1,
        })
        .returning();

      if (!newRow) throw new Error("Failed to create row");

      // Create a cell for EACH column with null/empty value
      if (tableColumns.length > 0) {
        await ctx.db.insert(cells).values(
          tableColumns.map((column) => ({
            rowId: newRow.id,
            columnId: column.id,
            value: faker.location.cardinalDirection(),
          })),
        );
      }

      return newRow;
    }),

  // addBulkRows: protectedProcedure
  //   .input(
  //     z.object({
  //       tableId: z.string(),
  //       count: z.number().max(100000),
  //     }),
  //   )
  //   .mutation(async ({ ctx, input }) => {

  //     // Get columns to know what cells to create
  //     const tableColumns = await ctx.db.query.columns.findMany({
  //       where: eq(columns.tableId, input.tableId),
  //       orderBy: (columns, { asc }) => [asc(columns.position)],
  //     });

  //     // Get current max row position
  //     const maxRowPosition = await ctx.db.query.rows.findFirst({
  //       where: eq(rows.tableId, input.tableId),
  //       orderBy: (rows, { desc }) => [desc(rows.position)],
  //     });

  //     const startPosition = (maxRowPosition?.position ?? -1) + 1;

  //     // Create rows in batches (1000 at a time for performance)
  //     const batchSize = 1000;
  //     const batches = Math.ceil(input.count / batchSize);

  //     for (let batch = 0; batch < batches; batch++) {
  //       const batchStart = batch * batchSize;
  //       const batchEnd = Math.min((batch + 1) * batchSize, input.count);

  //       const rowsToInsert = [];
  //       const cellsToInsert = [];

  //       for (let i = batchStart; i < batchEnd; i++) {
  //         rowsToInsert.push({
  //           tableId: input.tableId,
  //           position: startPosition + i,
  //           createdAt: new Date(),
  //           updatedAt: null,
  //         });

  //         // Create cells for each column
  //         tableColumns.forEach((column) => {
  //           let value: string;

  //           if (column.type === "number") {
  //             value = faker.number.int({ min: 1, max: 10000 });
  //           } else {
  //             value = faker.person.fullName();
  //           }

  //           cellsToInsert.push({
  //             columnId: column.id,
  //             value: value,
  //             updatedAt: null,
  //           });
  //         });
  //       }

  //       // Batch insert
  //       await ctx.db.insert(rows).values(rowsToInsert);
  //       await ctx.db.insert(cells).values(cellsToInsert);
  //     }

  //     return { inserted: input.count };
  //   }),
});
