import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { cells, columns, rows } from "@/server/db/schemas/bases";
import { getRowsInfiniteInput } from "@/types/view";
import { faker } from "@faker-js/faker";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lt,
  not,
  SQL,
  sql,
} from "drizzle-orm";
import { z } from "zod";

export const rowsRouter = createTRPCRouter({
  getRowsInfinite: protectedProcedure
    .input(getRowsInfiniteInput)
    .query(async ({ ctx, input }) => {
      console.log("🔧 Backend received input:", {
        tableId: input.tableId,
        globalSearch: input.globalSearch,
        filters: input.filters,
        sorting: input.sorting,
      });

      const offset = input.cursor ?? 0;
      const { sorting, filters, globalSearch } = input;

      // ── 1. Build ORDER BY ────────────────────────────────────────────────
      const orderByClauses: SQL[] = [];

      for (const sort of sorting) {
        const cellValueSubquery =
          sort.type === "number"
            ? sql`CAST((SELECT value FROM cell WHERE row_id = row.id AND column_id = ${sort.columnId} LIMIT 1) AS NUMERIC)`
            : sql`(SELECT value FROM cell WHERE row_id = row.id AND column_id = ${sort.columnId} LIMIT 1)`;

        orderByClauses.push(
          sort.direction === "desc"
            ? desc(cellValueSubquery)
            : asc(cellValueSubquery),
        );
      }

      orderByClauses.push(asc(rows.position));

      // ── 2. Build WHERE conditions ────────────────────────────────────────
      const whereConditions: SQL[] = [eq(rows.tableId, input.tableId)];

      // Column filters
      for (const f of filters) {
        const colId = f.columnId;

        const valueSubquery = sql`
        (SELECT value FROM cell 
         WHERE row_id = row.id AND column_id = ${colId} LIMIT 1)
      `;

        let condition: SQL;

        switch (f.operator) {
          case "equals":
            condition = eq(valueSubquery, f.value);
            break;
          case "contains":
            condition = ilike(valueSubquery, `%${f.value}%`);
            break;
          case "notContains":
            condition = not(ilike(valueSubquery, `%${f.value}%`));
            break;
          case "greaterThan":
            condition = gt(sql`CAST(${valueSubquery} AS NUMERIC)`, f.value);
            break;
          case "lessThan":
            condition = lt(sql`CAST(${valueSubquery} AS NUMERIC)`, f.value);
            break;
          case "isEmpty":
            condition = isNull(valueSubquery);
            break;
          case "isNotEmpty":
            condition = isNotNull(valueSubquery);
            break;
          default:
            continue;
        }

        whereConditions.push(condition);
      }

      const finalWhere = and(...whereConditions);

      console.log(
        "🎯 Executing query with",
        whereConditions.length,
        "conditions",
      );

      // ── 3. Execute Query ──────────────────────────────────────────────────
      const tableRows = await ctx.db
        .select()
        .from(rows)
        .where(finalWhere)
        .orderBy(...orderByClauses)
        .limit(input.limit)
        .offset(offset);

      console.log("📊 Query returned", tableRows.length, "rows");

      const rowIds = tableRows.map((r) => r.id);
      const rowCells = rowIds.length
        ? await ctx.db.select().from(cells).where(inArray(cells.rowId, rowIds))
        : [];

      const rowsWithCells = tableRows.map((row) => ({
        ...row,
        cells: rowCells.filter((c) => c.rowId === row.id),
      }));

      // ── 4. Calculate Search Matches (if globalSearch exists) ─────────────
      const searchMatches: {
        columnIds: string[];
        cells: Array<{ rowId: string; cellId: string }>;
      } = { columnIds: [], cells: [] };

      if (globalSearch?.trim()) {
        console.log("🔍 Calculating search matches for:", globalSearch);

        const searchTerm = globalSearch.trim().toLowerCase();

        // Get all columns for this table
        const tableColumns = await ctx.db
          .select({ id: columns.id, name: columns.name })
          .from(columns)
          .where(eq(columns.tableId, input.tableId));

        // Find matching column headers
        const matchedColumnIds = tableColumns
          .filter((col) => col.name.toLowerCase().includes(searchTerm))
          .map((col) => col.id);

        // Find matching cell values (only from the filtered/sorted rows)
        const matchedCells = rowCells
          .filter((cell) =>
            cell.value?.toString().toLowerCase().includes(searchTerm),
          )
          .map((cell) => ({
            rowId: cell.rowId,
            cellId: cell.id,
          }));

        searchMatches.columnIds = matchedColumnIds;
        searchMatches.cells = matchedCells;

        console.log("✅ Search matches:", {
          columns: matchedColumnIds.length,
          cells: matchedCells.length,
        });
      }

      console.log("✅ Returning", rowsWithCells.length, "rows with cells");

      return {
        items: rowsWithCells,
        searchMatches,
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
      return await ctx.db.transaction(async (tx) => {
        // Get all columns for this table
        const tableColumns = await tx.query.columns.findMany({
          where: eq(columns.tableId, input.tableId),
          orderBy: (columns, { asc }) => [asc(columns.position)],
        });

        // Create the row
        const [newRow] = await tx
          .insert(rows)
          .values({
            tableId: input.tableId,
          })
          .returning();

        if (!newRow) throw new Error("Failed to create row");

        // Create cells in batch
        if (tableColumns.length > 0) {
          await tx.insert(cells).values(
            tableColumns.map((column) => ({
              rowId: newRow.id,
              columnId: column.id,
              value: null,
            })),
          );
        }

        return newRow;
      });
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
