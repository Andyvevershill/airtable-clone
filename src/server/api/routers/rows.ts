import { generateBulkFakerData } from "@/lib/utils";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { cells, columns, rows } from "@/server/db/schemas/bases";
import { getRowsInfiniteInput, type SearchMatch } from "@/types/view";
import { and, eq, ilike, type SQL, sql } from "drizzle-orm";
import { z } from "zod";

type PageRow = {
  id: string;
  tableId: string;
  position: number;
  cells: { id: string; columnId: string; value: string | null }[];
};

// Guarded numeric cast: matches plain integers/decimals so CAST can never
// throw on stray non-numeric text; anything else becomes NULL (sorts last).
const NUMERIC_RE = "^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$";
const safeNumeric = (value: SQL) =>
  sql`CASE WHEN ${value} ~ ${NUMERIC_RE} THEN CAST(${value} AS REAL) END`;

export const rowsRouter = createTRPCRouter({
  getRowsInfinite: protectedProcedure
    .input(getRowsInfiniteInput)
    .query(async ({ ctx, input }) => {
      const { tableId, limit, cursor, filters, sorting, globalSearch } = input;

      const hasFilters = filters.length > 0;
      const hasSorting = sorting.length > 0;
      const isFirstPage = !cursor;
      const needsColumns = hasFilters || hasSorting;

      // Unsorted views paginate by keyset (cursor = last row's position) so
      // deep pages don't pay an OFFSET scan. Sorted views fall back to OFFSET
      // (cursor = offset) since the sort key lives in another table.
      const usesKeyset = !hasSorting;

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
        // A row matches when a cell for the filter's column satisfies the
        // condition. Negative operators (notContains, isEmpty) use NOT EXISTS
        // so rows with missing or empty cells count as matches, like Airtable.
        const cellFor = (columnId: string, cond: SQL) => sql`EXISTS (
          SELECT 1 FROM ${cells}
          WHERE ${cells.rowId} = ${rows.id}
            AND ${cells.columnId} = ${columnId}
            AND ${cond}
        )`;
        const hasValue = sql`${cells.value} IS NOT NULL AND ${cells.value} <> ''`;

        for (const filter of filters) {
          const column = columnMap.get(filter.columnId);
          if (!column) continue;

          switch (filter.operator) {
            case "equals": {
              const raw = String(filter.value ?? "");
              const num = parseFloat(raw);
              const cond =
                column.type === "number" && !Number.isNaN(num)
                  ? sql`${safeNumeric(sql`${cells.value}`)} = ${num}`
                  : sql`LOWER(${cells.value}) = LOWER(${raw})`;
              rowWhereClauses.push(cellFor(filter.columnId, cond));
              break;
            }
            case "contains":
              rowWhereClauses.push(
                cellFor(
                  filter.columnId,
                  ilike(cells.value, `%${filter.value}%`),
                ),
              );
              break;
            case "notContains":
              rowWhereClauses.push(
                sql`NOT ${cellFor(
                  filter.columnId,
                  ilike(cells.value, `%${filter.value}%`),
                )}`,
              );
              break;
            case "greaterThan":
            case "lessThan": {
              const num = parseFloat(filter.value as string);
              if (Number.isNaN(num)) break;
              const op = filter.operator === "greaterThan" ? sql`>` : sql`<`;
              rowWhereClauses.push(
                cellFor(
                  filter.columnId,
                  sql`${safeNumeric(sql`${cells.value}`)} ${op} ${num}`,
                ),
              );
              break;
            }
            case "isEmpty":
              rowWhereClauses.push(
                sql`NOT ${cellFor(filter.columnId, hasValue)}`,
              );
              break;
            case "isNotEmpty":
              rowWhereClauses.push(cellFor(filter.columnId, hasValue));
              break;
          }
        }
      }

      // Keyset predicate: resume after the last row of the previous page
      if (usesKeyset && cursor) {
        rowWhereClauses.push(sql`${rows.position} > ${cursor}`);
      }

      const finalWhere = and(...rowWhereClauses)!;

      // 3. Build sort joins + ORDER BY. Each sort rule joins that column's
      // cells once (hash/merge join over cell_column_value_idx) instead of
      // running a correlated subquery per row. Supports multiple sort rules.
      const sortJoins: SQL[] = [];
      const sortKeySelects: SQL[] = [];
      const innerOrderParts: SQL[] = [];
      const outerOrderParts: SQL[] = [];

      if (hasSorting && columnMap) {
        const cm = columnMap;
        sorting.forEach((sort, i) => {
          const col = cm.get(sort.columnId);
          if (!col) return;

          const alias = sql.raw(`sort_cell_${i}`);
          sortJoins.push(sql`LEFT JOIN ${cells} ${alias}
            ON ${alias}.row_id = ${rows.id}
            AND ${alias}.column_id = ${col.id}`);

          const sortKey =
            col.type === "number"
              ? safeNumeric(sql`${alias}.value`)
              : sql`${alias}.value`;

          const keyAlias = sql.raw(`"sortKey${i}"`);
          sortKeySelects.push(sql`, ${sortKey} AS ${keyAlias}`);

          const dir = sql.raw(sort.direction === "asc" ? "ASC" : "DESC");
          innerOrderParts.push(sql`${sortKey} ${dir} NULLS LAST`);
          outerOrderParts.push(sql`p.${keyAlias} ${dir} NULLS LAST`);
        });
      }

      innerOrderParts.push(sql`${rows.position} ASC`);
      outerOrderParts.push(sql`p."position" ASC`);

      const sortJoin = sql.join(sortJoins, sql` `);
      const sortKeySelect = sql.join(sortKeySelects, sql``);
      const innerOrder = sql.join(innerOrderParts, sql`, `);
      const outerOrder = sql.join(outerOrderParts, sql`, `);

      const offsetClause = usesKeyset ? sql`` : sql`OFFSET ${cursor ?? 0}`;

      // 4. Single round trip for the page: resolve the row window first, then
      // attach each row's cells as JSON via a lateral join (runs only for the
      // limit+1 rows of the page, never the whole table).
      const pageQuery = sql`
        SELECT
          p."id",
          p."tableId",
          p."position",
          COALESCE(cj.cells, '[]'::json) AS cells
        FROM (
          SELECT
            ${rows.id} AS "id",
            ${rows.tableId} AS "tableId",
            ${rows.position} AS "position"
            ${sortKeySelect}
          FROM ${rows}
          ${sortJoin}
          WHERE ${finalWhere}
          ORDER BY ${innerOrder}
          LIMIT ${limit + 1}
          ${offsetClause}
        ) p
        LEFT JOIN LATERAL (
          SELECT json_agg(
            json_build_object(
              'id', c.id,
              'columnId', c.column_id,
              'value', c.value
            )
          ) AS cells
          FROM ${cells} c
          WHERE c.row_id = p."id"
        ) cj ON TRUE
        ORDER BY ${outerOrder}
      `;

      const searchTerm = globalSearch?.trim().toLowerCase();

      // 5. Page, filtered count (first page only) and matching column headers
      // all run in parallel — no sequential round trips.
      const [pageRows, countResult, columnHeaders] = await Promise.all([
        ctx.db.execute<PageRow>(pageQuery),

        hasFilters && isFirstPage
          ? ctx.db
              .select({ count: sql<number>`count(*)` })
              .from(rows)
              .where(finalWhere)
          : Promise.resolve([{ count: undefined }]),

        searchTerm
          ? ctx.db
              .select({ id: columns.id })
              .from(columns)
              .where(
                and(
                  eq(columns.tableId, tableId),
                  ilike(columns.name, `%${searchTerm}%`),
                ),
              )
          : Promise.resolve([]),
      ]);

      const hasMore = pageRows.length > limit;
      const visibleRows = hasMore ? pageRows.slice(0, limit) : [...pageRows];

      const items = visibleRows.map((row) => ({
        id: row.id,
        tableId: row.tableId,
        cells: row.cells,
      }));

      const totalFilteredCount = countResult[0]?.count;

      // 6. Global search matches (columns + cells on this page)
      const matches: SearchMatch[] = [];

      if (searchTerm) {
        matches.push(
          ...columnHeaders.map((column) => ({
            type: "column" as const,
            columnId: column.id,
          })),
        );

        items.forEach((row, idx) => {
          row.cells.forEach((cell) => {
            if (
              cell.value &&
              String(cell.value).toLowerCase().includes(searchTerm)
            ) {
              matches.push({
                type: "cell",
                cellId: `${row.id}_${cell.columnId}`,
                rowIndex: idx,
              });
            }
          });
        });
      }

      let nextCursor: number | undefined;
      if (hasMore) {
        nextCursor = usesKeyset
          ? visibleRows[visibleRows.length - 1]!.position
          : (cursor ?? 0) + limit;
      }

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
          .returning({ id: rows.id });

        if (!newRow) {
          throw new Error("Failed to create row");
        }

        if (tableColumns.length > 0) {
          await tx.insert(cells).values(
            tableColumns.map((column) => ({
              rowId: newRow.id,
              columnId: column.id,
              value: null,
            })),
          );
        }
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
      const tableColumns = await ctx.db.query.columns.findMany({
        where: eq(columns.tableId, input.tableId),
        orderBy: (columns, { asc }) => [asc(columns.position)],
        columns: {
          id: true,
          type: true,
          name: true,
        },
      });

      // Faker pools: cells sample from these in SQL via random(), so the
      // pool only needs enough values to look organic — not one per row.
      const poolSize = Math.min(input.count, 1000);
      const colIds = tableColumns.map((c) => c.id);
      const pools = tableColumns.map((c) =>
        generateBulkFakerData(c.type, c.name, poolSize),
      );
      const colIdsJson = JSON.stringify(colIds);
      const poolsJson = JSON.stringify(pools);

      const totalRows = input.count;
      const rowBatchSize = 25000;
      const rowBatches = Math.ceil(totalRows / rowBatchSize);

      let totalInserted = 0;
      let lastError: Error | null = null;

      for (let batch = 0; batch < rowBatches; batch++) {
        const batchStart = batch * rowBatchSize;
        const currentBatchSize =
          Math.min(batchStart + rowBatchSize, totalRows) - batchStart;

        try {
          // One atomic data-modifying CTE per batch: rows and all their
          // cells are created inside the database, with SQL-generated ids
          // and values picked from the JSON pools — nothing round-trips.
          await ctx.db.execute(sql`
            WITH new_rows AS (
              INSERT INTO ${rows} (id, table_id, created_at)
              SELECT gen_random_uuid()::text, ${input.tableId}, now()
              FROM generate_series(1, ${currentBatchSize})
              RETURNING id
            ),
            cols AS (
              SELECT col_id, (ord)::int AS ord
              FROM jsonb_array_elements_text(${colIdsJson}::jsonb)
                WITH ORDINALITY AS t(col_id, ord)
            )
            INSERT INTO ${cells} (id, row_id, column_id, value)
            SELECT gen_random_uuid()::text, nr.id, cols.col_id,
                   ${poolsJson}::jsonb
                     -> (cols.ord - 1)
                     ->> floor(random() * ${poolSize})::int
            FROM new_rows nr
            CROSS JOIN cols
          `);

          totalInserted += currentBatchSize;
        } catch (error) {
          lastError = error as Error;
          break;
        }
      }

      return {
        inserted: totalInserted,
        requested: totalRows,
        failed: lastError !== null,
        error: lastError?.message,
      };
    }),
});
