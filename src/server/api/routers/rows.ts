import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { cells, columns, rows } from "@/server/db/schemas/bases";
import { faker } from "@faker-js/faker";
import { asc, desc, eq, sql } from "drizzle-orm";
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
        limit: z.number().min(1).max(1000).default(200),
        cursor: z.number().nullish(),
        sort: z
          .object({
            columnId: z.string(),
            direction: z.enum(["asc", "desc"]),
            type: z.enum(["string", "number"]).default("string"),
          })
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const offset = input.cursor ?? 0;
      const { sort } = input;

      const cellValueSubquery = sort
        ? sort.type === "number"
          ? sql`
        (
          SELECT CAST(cell.value AS NUMERIC)
          FROM cell
          WHERE cell.row_id = row.id
            AND cell.column_id = ${sort.columnId}
          LIMIT 1
        )
      `
          : sql`
        (
          SELECT cell.value
          FROM cell
          WHERE cell.row_id = row.id
            AND cell.column_id = ${sort.columnId}
          LIMIT 1
        )
      `
        : null;

      const orderBy = sort
        ? [
            sort.direction === "desc"
              ? desc(cellValueSubquery!)
              : asc(cellValueSubquery!),
            asc(rows.position), // stable fallback
          ]
        : [asc(rows.position)];

      const tableRows = await ctx.db
        .select()
        .from(rows)
        .where(eq(rows.tableId, input.tableId))
        .orderBy(...orderBy)
        .limit(input.limit)
        .offset(offset);

      // fetch cells separately (important for performance & correctness)
      const rowIds = tableRows.map((r) => r.id);

      const rowCells = rowIds.length
        ? await ctx.db
            .select()
            .from(cells)
            .where(sql`${cells.rowId} IN ${rowIds}`)
        : [];

      const rowsWithCells = tableRows.map((row) => ({
        ...row,
        cells: rowCells.filter((c) => c.rowId === row.id),
      }));

      return {
        items: rowsWithCells,
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

  addBulkRows: protectedProcedure
    .input(
      z.object({
        tableId: z.string(),
        count: z.number().max(100000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      console.log(
        `[addBulkRows] Starting bulk insert of 100k rows for table ${input.tableId}`,
      );

      // Get columns to know what cells to create
      const tableColumns = await ctx.db.query.columns.findMany({
        where: eq(columns.tableId, input.tableId),
        orderBy: (columns, { asc }) => [asc(columns.position)],
      });

      console.log(`[addBulkRows] Found ${tableColumns.length} columns`);

      const maxRowPosition = await ctx.db.query.rows.findFirst({
        where: eq(rows.tableId, input.tableId),
        orderBy: (rows, { desc }) => [desc(rows.position)],
      });

      const startPosition = (maxRowPosition?.position ?? -1) + 1;
      console.log(`[addBulkRows] Starting position: ${startPosition}`);

      const totalRows = 100000;

      const batchSize = 1000;
      const batches = Math.ceil(totalRows / batchSize);

      console.log(`[addBulkRows] Processing ${batches} batch(es)`);

      for (let batch = 0; batch < batches; batch++) {
        const batchStart = batch * batchSize;
        const batchEnd = Math.min((batch + 1) * batchSize, totalRows);

        console.log(
          `[addBulkRows] Batch ${batch + 1}/${batches}: Inserting rows ${batchStart} to ${batchEnd - 1}`,
        );

        const rowsToInsert = [];

        for (let i = batchStart; i < batchEnd; i++) {
          rowsToInsert.push({
            tableId: input.tableId,
            position: startPosition + i,
            createdAt: new Date(),
            updatedAt: null,
          });
        }

        // Insert rows and get their IDs back
        const insertedRows = await ctx.db
          .insert(rows)
          .values(rowsToInsert)
          .returning();
        console.log(`[addBulkRows] Inserted ${insertedRows.length} rows`);

        // Now create cells for each inserted row
        const cellsToInsert = [];

        for (const row of insertedRows) {
          for (const column of tableColumns) {
            const value = faker.person.fullName();

            cellsToInsert.push({
              rowId: row.id, // Use the actual row ID from the inserted row
              columnId: column.id,
              value: value,
              updatedAt: null,
            });
          }
        }

        console.log(
          `[addBulkRows] Inserting ${cellsToInsert.length} cells (${tableColumns.length} columns × ${insertedRows.length} rows)`,
        );

        // Batch insert cells
        await ctx.db.insert(cells).values(cellsToInsert);
        console.log(`[addBulkRows] Batch ${batch + 1} complete`);
      }

      console.log(
        `[addBulkRows] Successfully inserted ${totalRows} rows with their cells`,
      );

      return { inserted: totalRows };
    }),
});
