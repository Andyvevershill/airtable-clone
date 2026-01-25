import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { cells, columns, rows } from "@/server/db/schemas/bases";
import { getRowsInfiniteInput, type SearchMatch } from "@/types/view";
import { faker } from "@faker-js/faker";
import {
  and,
  asc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  not,
  SQL,
  sql,
} from "drizzle-orm";
import { z } from "zod";

export const rowsRouter = createTRPCRouter({
  getRowsInfinite: protectedProcedure
    .input(getRowsInfiniteInput)
    .query(async ({ ctx, input }) => {
      const { tableId, limit, cursor, filters, sorting, globalSearch } = input;
      const offset = cursor ?? 0;

      const hasFilters = filters.length > 0;
      const hasSorting = sorting.length > 0;
      const isFirstPage = offset === 0;
      const needsColumns = hasFilters || hasSorting;

      // 1. Fetch column metadata if needed for filters or sorting
      let columnMap: Map<string, { id: string; type: string }> | null = null;
      if (needsColumns) {
        const tableColumns = await ctx.db
          .select({
            id: columns.id,
            type: columns.type,
          })
          .from(columns)
          .where(eq(columns.tableId, tableId));

        columnMap = new Map(tableColumns.map((c) => [c.id, c]));
      }

      // 2. Build WHERE clause with filter conditions
      const rowWhereClauses: SQL[] = [eq(rows.tableId, tableId)];

      if (hasFilters && columnMap) {
        for (const filter of filters) {
          const column = columnMap.get(filter.columnId);
          if (!column) continue;

          let cellCond: SQL;

          switch (filter.operator) {
            case "equals":
              cellCond = sql`LOWER(${cells.value}) = LOWER(${filter.value as string})`;
              break;
            case "contains":
              cellCond = ilike(cells.value, `%${filter.value}%`);
              break;
            case "notContains":
              cellCond = not(ilike(cells.value, `%${filter.value}%`));
              break;
            case "greaterThan":
              cellCond = sql`CAST(${cells.value} AS REAL) > ${parseFloat(filter.value as string)}`;
              break;
            case "lessThan":
              cellCond = sql`CAST(${cells.value} AS REAL) < ${parseFloat(filter.value as string)}`;
              break;
            case "isEmpty":
              cellCond = isNull(cells.value);
              break;
            case "isNotEmpty":
              cellCond = isNotNull(cells.value);
              break;
          }

          if (cellCond) {
            rowWhereClauses.push(
              sql`EXISTS (
              SELECT 1 FROM ${cells}
              WHERE ${cells.rowId} = ${rows.id}
                AND ${cells.columnId} = ${filter.columnId}
                AND ${cellCond}
            )`,
            );
          }
        }
      }

      const finalWhere = and(...rowWhereClauses);

      // 3. Build ORDER BY clause with sorting logic
      const orderByClauses: SQL[] = [];

      if (hasSorting && columnMap) {
        const sort = sorting[0]!;
        const col = columnMap.get(sort.columnId);

        if (col) {
          const sortValue = sql`(
          SELECT ${cells.value}
          FROM ${cells}
          WHERE ${cells.rowId} = ${rows.id}
            AND ${cells.columnId} = ${col.id}
          LIMIT 1
        )`;

          const castValue =
            col.type === "number"
              ? sql`CAST((${sortValue}) AS REAL)`
              : sortValue;

          const orderedExpr =
            sort.direction === "asc"
              ? sql`${castValue} ASC NULLS LAST`
              : sql`${castValue} DESC NULLS LAST`;

          orderByClauses.push(orderedExpr);
        }
      }

      // Always add position for stable sorting
      orderByClauses.push(asc(rows.position));

      // 4. Fetch rows and count in parallel (batched)
      const [pageRows, countResult] = await Promise.all([
        ctx.db
          .select({
            id: rows.id,
            tableId: rows.tableId,
            position: rows.position,
          })
          .from(rows)
          .where(finalWhere)
          .orderBy(...orderByClauses)
          .limit(limit + 1)
          .offset(offset),

        hasFilters && isFirstPage
          ? ctx.db
              .select({ count: sql<number>`count(*)` })
              .from(rows)
              .where(finalWhere)
          : Promise.resolve([{ count: undefined }]),
      ]);

      const hasMore = pageRows.length > limit;
      const visibleRows = hasMore ? pageRows.slice(0, limit) : pageRows;
      const rowIds = visibleRows.map((r) => r.id);

      // 5. Fetch all cells for visible rows
      const cellsData = rowIds.length
        ? await ctx.db.select().from(cells).where(inArray(cells.rowId, rowIds))
        : [];

      // 6. Group cells by row ID
      const cellsByRow = new Map<string, (typeof cellsData)[number][]>();
      for (const cell of cellsData) {
        const list = cellsByRow.get(cell.rowId) ?? [];
        list.push(cell);
        cellsByRow.set(cell.rowId, list);
      }

      // 7. Build final response items
      const items = visibleRows.map((row) => ({
        id: row.id,
        tableId: row.tableId,
        cells: (cellsByRow.get(row.id) ?? []).map((c) => ({
          id: c.id,
          columnId: c.columnId,
          value: c.value,
        })),
      }));

      const totalFilteredCount = countResult[0]?.count;

      // 8. Perform global search if term provided
      const matches: SearchMatch[] = [];

      if (globalSearch?.trim()) {
        const term = globalSearch.trim().toLowerCase();

        const columnHeaders = await ctx.db
          .select({
            id: columns.id,
          })
          .from(columns)
          .where(
            and(eq(columns.tableId, tableId), ilike(columns.name, `%${term}%`)),
          );

        const dataToPush = columnHeaders.map((column) => ({
          type: "column" as const,
          columnId: column.id,
        }));

        matches.push(...dataToPush);

        items.forEach((row, idx) => {
          row.cells.forEach((cell) => {
            if (cell.value && String(cell.value).toLowerCase().includes(term)) {
              matches.push({
                type: "cell",
                cellId: `${row.id}_${cell.columnId}`,
                rowIndex: idx,
              });
            }
          });
        });
      }

      const nextCursor = hasMore ? offset + limit : undefined;

      return {
        items,
        searchMatches: matches,
        totalFilteredCount,
        nextCursor,
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
          _rowId: newRow.id,
          _cells: Object.fromEntries(
            createdCells.map((cell) => [cell.columnId, cell.value]),
          ),
          _cellMap: Object.fromEntries(
            createdCells.map((cell) => [cell.columnId, cell.id]),
          ),
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
