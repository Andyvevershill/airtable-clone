import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { cells, columns, rows } from "@/server/db/schemas/bases";
import { getRowsInfiniteInput, type SearchMatch } from "@/types/view";
import { faker } from "@faker-js/faker";
import {
  and,
  asc,
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
      const offset = input.cursor ?? 0;
      const { sorting, filters, globalSearch } = input;

      //  Build dynamic LEFT JOINs for sorting columns
      let query = ctx.db
        .select({
          rowId: rows.id,
          rowTableId: rows.tableId,
          rowPosition: rows.position,
          cellId: cells.id,
          cellRowId: cells.rowId,
          cellColumnId: cells.columnId,
          cellValue: cells.value,
        })
        .from(rows)
        .leftJoin(cells, eq(cells.rowId, rows.id))
        .$dynamic();

      //  Build WHERE conditions
      const whereConditions: SQL[] = [eq(rows.tableId, input.tableId)];

      // Column filters - we need to filter on the joined cells
      // For filters, we'll need to ensure the cell matches the column
      if (filters.length > 0) {
        const filterConditions: SQL[] = [];

        for (const f of filters) {
          switch (f.operator) {
            case "equals":
              filterConditions.push(
                and(
                  eq(cells.columnId, f.columnId),
                  eq(cells.value, f.value as string),
                )!,
              );
              break;
            case "contains":
              filterConditions.push(
                and(
                  eq(cells.columnId, f.columnId),
                  ilike(cells.value, `%${f.value}%`),
                )!,
              );
              break;
            case "notContains":
              filterConditions.push(
                and(
                  eq(cells.columnId, f.columnId),
                  not(ilike(cells.value, `%${f.value}%`)),
                )!,
              );
              break;
            case "greaterThan":
              filterConditions.push(
                and(
                  eq(cells.columnId, f.columnId),
                  gt(sql`CAST(${cells.value} AS NUMERIC)`, f.value as number),
                )!,
              );
              break;
            case "lessThan":
              filterConditions.push(
                and(
                  eq(cells.columnId, f.columnId),
                  lt(sql`CAST(${cells.value} AS NUMERIC)`, f.value as number),
                )!,
              );
              break;
            case "isEmpty":
              filterConditions.push(
                and(eq(cells.columnId, f.columnId), isNull(cells.value))!,
              );
              break;
            case "isNotEmpty":
              filterConditions.push(
                and(eq(cells.columnId, f.columnId), isNotNull(cells.value))!,
              );
              break;
            default:
              continue;
          }
        }

        // For filters, we use a subquery approach since we need ALL filters to match
        // This checks that the row has cells matching all filter criteria
        if (filterConditions.length > 0) {
          for (const filterCond of filterConditions) {
            whereConditions.push(
              sql`EXISTS (
                SELECT 1 FROM ${cells} 
                WHERE ${cells.rowId} = ${rows.id} 
                AND ${filterCond}
              )`,
            );
          }
        }
      }

      // ── 3. Get filtered row IDs first (much faster) ──────────────────────
      // Step 1: Get just the row IDs that match filters and sorting
      const orderByClauses: SQL[] = [];

      for (const sort of sorting) {
        // Use a lateral join or subquery for sorting
        const sortExpr =
          sort.type === "number"
            ? sql`(SELECT CAST(value AS NUMERIC) FROM ${cells} WHERE ${cells.rowId} = ${rows.id} AND ${cells.columnId} = ${sort.columnId} LIMIT 1)`
            : sql`(SELECT LOWER(value) FROM ${cells} WHERE ${cells.rowId} = ${rows.id} AND ${cells.columnId} = ${sort.columnId} LIMIT 1)`;

        if (sort.direction === "desc") {
          orderByClauses.push(sql`${sortExpr} DESC NULLS LAST`);
        } else {
          orderByClauses.push(sql`${sortExpr} ASC NULLS LAST`);
        }
      }

      orderByClauses.push(asc(rows.position));

      const finalWhere = and(...whereConditions);

      // Get paginated row IDs with sorting
      const paginatedRows = await ctx.db
        .select({
          id: rows.id,
          tableId: rows.tableId,
          position: rows.position,
        })
        .from(rows)
        .where(finalWhere)
        .orderBy(...orderByClauses)
        .limit(input.limit)
        .offset(offset);

      const rowIds = paginatedRows.map((r) => r.id);

      // ── 4. Fetch all cells for these rows in ONE query ──────────────────
      const rowCells = rowIds.length
        ? await ctx.db
            .select({
              id: cells.id,
              rowId: cells.rowId,
              columnId: cells.columnId,
              value: cells.value,
            })
            .from(cells)
            .where(inArray(cells.rowId, rowIds))
        : [];

      // ── 5. Assemble rows with cells ──────────────────────────────────────
      const rowsWithCells = paginatedRows.map((row) => ({
        id: row.id,
        tableId: row.tableId,
        position: row.position,
        cells: rowCells.filter((c) => c.rowId === row.id),
      }));

      // ── 6. Calculate Search Matches (if globalSearch exists) ─────────────
      const searchMatches: {
        matches: SearchMatch[];
      } = { matches: [] };

      if (globalSearch?.trim()) {
        const searchTerm = globalSearch.trim().toLowerCase();

        // Column matches (first)
        const tableColumns = await ctx.db
          .select({ id: columns.id, name: columns.name })
          .from(columns)
          .where(eq(columns.tableId, input.tableId));

        for (const col of tableColumns) {
          if (col.name.toLowerCase().includes(searchTerm)) {
            searchMatches.matches.push({
              type: "column",
              columnId: col.id,
            });
          }
        }

        // Cell matches - with row index
        for (const cell of rowCells) {
          if (cell.value?.toString().toLowerCase().includes(searchTerm)) {
            const rowIndex = paginatedRows.findIndex(
              (row) => row.id === cell.rowId,
            );

            searchMatches.matches.push({
              type: "cell",
              cellId: `${cell.rowId}_${cell.columnId}`,
              rowIndex: rowIndex !== -1 ? rowIndex : 0,
            });
          }
        }
      }

      return {
        items: rowsWithCells,
        searchMatches,
        nextCursor:
          paginatedRows.length === input.limit
            ? offset + input.limit
            : undefined,
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
    .input(z.object({ tableId: z.string(), id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const tableColumns = await tx.query.columns.findMany({
          where: eq(columns.tableId, input.tableId),
          orderBy: (columns, { asc }) => [asc(columns.position)],
        });

        // Create the row
        const [newRow] = await tx
          .insert(rows)
          .values({
            id: input.id,
            tableId: input.tableId,
          })
          .returning();

        if (!newRow) {
          throw new Error("Failed to create row");
        }

        // Create cells
        let createdCells: {
          id: string;
          rowId: string;
          columnId: string;
          value: string | null;
        }[] = [];

        if (tableColumns.length > 0) {
          createdCells = await tx
            .insert(cells)
            .values(
              tableColumns.map((column) => ({
                rowId: newRow.id,
                columnId: column.id,
                value: null,
              })),
            )
            .returning({
              id: cells.id,
              rowId: cells.rowId,
              columnId: cells.columnId,
              value: cells.value,
            });
        }

        return {
          id: newRow.id,
          tableId: newRow.tableId,
          position: newRow.position,
          cells: createdCells,
        };
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
        `[addBulkRows] Starting bulk insert of ${input.count} rows for table ${input.tableId}`,
      );

      // Get columns to know what cells to create
      const tableColumns = await ctx.db.query.columns.findMany({
        where: eq(columns.tableId, input.tableId),
        orderBy: (columns, { asc }) => [asc(columns.position)],
      });

      console.log(`[addBulkRows] Found ${tableColumns.length} columns`);

      const totalRows = input.count;
      const batchSize = 1000;
      const batches = Math.ceil(totalRows / batchSize);

      console.log(`[addBulkRows] Processing ${batches} batch(es)`);

      let totalInserted = 0;

      for (let batch = 0; batch < batches; batch++) {
        const batchStart = batch * batchSize;
        const batchEnd = Math.min((batch + 1) * batchSize, totalRows);
        const currentBatchSize = batchEnd - batchStart;

        console.log(
          `[addBulkRows] Batch ${batch + 1}/${batches}: Inserting ${currentBatchSize} rows`,
        );

        const rowsToInsert = Array.from({ length: currentBatchSize }, () => ({
          tableId: input.tableId,
          createdAt: new Date(),
          updatedAt: null,
        }));

        // Insert rows and get their IDs back
        const insertedRows = await ctx.db
          .insert(rows)
          .values(rowsToInsert)
          .returning();

        console.log(`[addBulkRows] Inserted ${insertedRows.length} rows`);

        // Prepare cells for batch insert
        const cellsToInsert = insertedRows.flatMap((row) =>
          tableColumns.map((column) => ({
            rowId: row.id,
            columnId: column.id,
            value: faker.person.firstName(),
            updatedAt: null,
          })),
        );

        console.log(
          `[addBulkRows] Inserting ${cellsToInsert.length} cells (${tableColumns.length} columns × ${insertedRows.length} rows)`,
        );

        // Batch insert cells - split into smaller chunks if needed
        const cellBatchSize = 5000;
        for (let i = 0; i < cellsToInsert.length; i += cellBatchSize) {
          const cellBatch = cellsToInsert.slice(i, i + cellBatchSize);
          await ctx.db.insert(cells).values(cellBatch);
        }

        totalInserted += insertedRows.length;
        console.log(
          `[addBulkRows] Batch ${batch + 1} complete. Total: ${totalInserted}/${totalRows}`,
        );
      }

      console.log(
        `[addBulkRows] Successfully inserted ${totalInserted} rows with their cells`,
      );

      return { inserted: totalInserted };
    }),
});
