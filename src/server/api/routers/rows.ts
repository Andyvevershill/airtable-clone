import {
  BULK_ROWS_OWNER_EMAIL,
  MAX_ROWS_PER_USER_REQUEST,
} from "@/lib/constants";
import { checkTableOwner } from "@/server/api/ownership";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import type { db } from "@/server/db";
import { cells, columns, rows } from "@/server/db/schemas/bases";
import { generateBulkFakerData } from "@/server/faker";
import {
  getRowsInput,
  searchMatchesInput,
  type FilterState,
  type SearchMatch,
  type SortRule,
} from "@/types/view";
import { TRPCError } from "@trpc/server";
import { and, asc, eq, ilike, type SQL, sql } from "drizzle-orm";
import { z } from "zod";

type PageRow = {
  id: string;
  tableId: string;
  cells: { columnId: string; value: string | null }[];
};

type ColumnMap = Map<string, { id: string; type: string }>;

const MAX_SEARCH_MATCHES = 1000;

// Guarded numeric cast: matches plain integers/decimals so CAST can never
// throw on stray non-numeric text; anything else becomes NULL (sorts last).
const NUMERIC_RE = "^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$";
const safeNumeric = (value: SQL) =>
  sql`CASE WHEN ${value} ~ ${NUMERIC_RE} THEN CAST(${value} AS REAL) END`;

// escape % and _ so searching "50%" doesn't act as a wildcard
const likePattern = (value: string) => `%${value.replace(/[\\%_]/g, "\\$&")}%`;

async function getColumnMap(database: typeof db, tableId: string) {
  const tableColumns = await database
    .select({ id: columns.id, type: columns.type })
    .from(columns)
    .where(eq(columns.tableId, tableId));

  return new Map(tableColumns.map((c) => [c.id, c])) as ColumnMap;
}

// A row matches when a cell for the filter's column satisfies the
// condition. Negative operators (notContains, isEmpty) use NOT EXISTS
// so rows with missing or empty cells count as matches, like Airtable.
function buildWhere(
  tableId: string,
  filters: FilterState[],
  columnMap: ColumnMap,
) {
  const clauses: SQL[] = [eq(rows.tableId, tableId)];

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

    const raw = String(filter.value ?? "");

    switch (filter.operator) {
      case "equals": {
        const num = parseFloat(raw);
        const cond =
          column.type === "number" && !Number.isNaN(num)
            ? sql`${safeNumeric(sql`${cells.value}`)} = ${num}`
            : sql`LOWER(${cells.value}) = LOWER(${raw})`;
        clauses.push(cellFor(filter.columnId, cond));
        break;
      }
      case "contains":
        clauses.push(
          cellFor(filter.columnId, ilike(cells.value, likePattern(raw))),
        );
        break;
      case "notContains":
        clauses.push(
          sql`NOT ${cellFor(
            filter.columnId,
            ilike(cells.value, likePattern(raw)),
          )}`,
        );
        break;
      case "greaterThan":
      case "lessThan": {
        const num = parseFloat(raw);
        if (Number.isNaN(num)) break;
        const op = filter.operator === "greaterThan" ? sql`>` : sql`<`;
        clauses.push(
          cellFor(
            filter.columnId,
            sql`${safeNumeric(sql`${cells.value}`)} ${op} ${num}`,
          ),
        );
        break;
      }
      case "isEmpty":
        clauses.push(sql`NOT ${cellFor(filter.columnId, hasValue)}`);
        break;
      case "isNotEmpty":
        clauses.push(cellFor(filter.columnId, hasValue));
        break;
    }
  }

  return and(...clauses)!;
}

// Each sort rule joins that column's cells once (hash/merge join over
// cell_column_value_idx) instead of running a correlated subquery per row.
// position is always the last tie breaker so the order is stable.
function buildSort(sorting: SortRule[], columnMap: ColumnMap) {
  const joins: SQL[] = [];
  const keySelects: SQL[] = [];
  const innerOrder: SQL[] = [];
  const outerOrder: SQL[] = [];

  sorting.forEach((sort, i) => {
    const col = columnMap.get(sort.columnId);
    if (!col) return;

    const alias = sql.raw(`sort_cell_${i}`);
    joins.push(sql`LEFT JOIN ${cells} ${alias}
      ON ${alias}.row_id = ${rows.id}
      AND ${alias}.column_id = ${col.id}`);

    const sortKey =
      col.type === "number"
        ? safeNumeric(sql`${alias}.value`)
        : sql`${alias}.value`;

    const keyAlias = sql.raw(`"sortKey${i}"`);
    keySelects.push(sql`, ${sortKey} AS ${keyAlias}`);

    const dir = sql.raw(sort.direction === "asc" ? "ASC" : "DESC");
    innerOrder.push(sql`${sortKey} ${dir} NULLS LAST`);
    outerOrder.push(sql`p.${keyAlias} ${dir} NULLS LAST`);
  });

  innerOrder.push(sql`${rows.position} ASC`);
  outerOrder.push(sql`p."position" ASC`);

  return {
    joins: sql.join(joins, sql` `),
    keySelects: sql.join(keySelects, sql``),
    innerOrder: sql.join(innerOrder, sql`, `),
    outerOrder: sql.join(outerOrder, sql`, `),
  };
}

export const rowsRouter = createTRPCRouter({
  getRows: protectedProcedure
    .input(getRowsInput)
    .query(async ({ ctx, input }) => {
      const { tableId, limit, page, filters, sorting } = input;

      const hasFilters = filters.length > 0;
      const needsColumns = hasFilters || sorting.length > 0;

      // 1. ownership check + column types (only needed for filters / sorting) at the same time
      const [, columnMap] = await Promise.all([
        checkTableOwner(ctx, tableId),
        needsColumns
          ? getColumnMap(ctx.db, tableId)
          : Promise.resolve(new Map() as ColumnMap),
      ]);

      const where = buildWhere(tableId, filters, columnMap);
      const sort = buildSort(sorting, columnMap);

      // 2. Single round trip for the page: resolve the row window first, then
      // attach each row's cells as JSON via a lateral join (only runs for the
      // rows on this page). OFFSET by page so the grid can jump to any page
      const pageQuery = sql`
        SELECT
          p."id",
          p."tableId",
          COALESCE(cj.cells, '[]'::json) AS cells
        FROM (
          SELECT
            ${rows.id} AS "id",
            ${rows.tableId} AS "tableId",
            ${rows.position} AS "position"
            ${sort.keySelects}
          FROM ${rows}
          ${sort.joins}
          WHERE ${where}
          ORDER BY ${sort.innerOrder}
          LIMIT ${limit}
          OFFSET ${page * limit}
        ) p
        LEFT JOIN LATERAL (
          SELECT json_agg(
            json_build_object(
              'columnId', c.column_id,
              'value', c.value
            )
          ) AS cells
          FROM ${cells} c
          WHERE c.row_id = p."id"
        ) cj ON TRUE
        ORDER BY ${sort.outerOrder}
      `;

      // 3. filtered count is only needed once (first page), runs alongside the page
      const [pageRows, countResult] = await Promise.all([
        ctx.db.execute<PageRow>(pageQuery),

        hasFilters && page === 0
          ? ctx.db
              .select({ count: sql<number>`count(*)::int` })
              .from(rows)
              .where(where)
          : Promise.resolve([{ count: undefined }]),
      ]);

      return {
        items: pageRows.map((row) => ({
          id: row.id,
          tableId: row.tableId,
          cells: row.cells,
        })),
        totalFilteredCount: countResult[0]?.count,
      };
    }),

  // searches the whole table (not just what's loaded) in the current sort/filter order
  searchMatches: protectedProcedure
    .input(searchMatchesInput)
    .query(async ({ ctx, input }) => {
      const { tableId, filters, sorting } = input;
      const search = input.search.trim();

      if (!search) return [];

      const [, columnMap] = await Promise.all([
        checkTableOwner(ctx, tableId),
        getColumnMap(ctx.db, tableId),
      ]);

      const where = buildWhere(tableId, filters, columnMap);
      const sort = buildSort(sorting, columnMap);
      const pattern = likePattern(search);

      const [columnHeaders, cellMatches] = await Promise.all([
        ctx.db
          .select({ id: columns.id })
          .from(columns)
          .where(
            and(eq(columns.tableId, tableId), ilike(columns.name, pattern)),
          )
          .orderBy(asc(columns.position)),

        // number every row in the grid's order, so rowIndex = where it sits in the whole table
        ctx.db.execute<{ rowId: string; columnId: string; rowIndex: number }>(
          sql`
            WITH ordered AS (
              SELECT
                ${rows.id} AS "id",
                ROW_NUMBER() OVER (ORDER BY ${sort.innerOrder}) - 1 AS "rowIndex"
              FROM ${rows}
              ${sort.joins}
              WHERE ${where}
            )
            SELECT
              o."id" AS "rowId",
              c.column_id AS "columnId",
              o."rowIndex"::int AS "rowIndex"
            FROM ordered o
            JOIN ${cells} c ON c.row_id = o."id"
            JOIN ${columns} col ON col.id = c.column_id
            WHERE c.value ILIKE ${pattern}
            ORDER BY o."rowIndex", col.position
            LIMIT ${MAX_SEARCH_MATCHES}
          `,
        ),
      ]);

      const matches: SearchMatch[] = [
        ...columnHeaders.map((column) => ({
          type: "column" as const,
          columnId: column.id,
        })),
        ...cellMatches.map((match) => ({
          type: "cell" as const,
          cellId: `${match.rowId}_${match.columnId}`,
          rowIndex: match.rowIndex,
        })),
      ];

      return matches;
    }),

  getRowCount: protectedProcedure
    .input(z.object({ tableId: z.string() }))
    .query(async ({ ctx, input }) => {
      await checkTableOwner(ctx, input.tableId);

      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(rows)
        .where(eq(rows.tableId, input.tableId));

      return countResult[0]?.count ?? 0;
    }),

  addRow: protectedProcedure
    .input(z.object({ tableId: z.string(), id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkTableOwner(ctx, input.tableId);

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
        count: z.number().int().min(1).max(100000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (
        input.count > MAX_ROWS_PER_USER_REQUEST &&
        ctx.session.user.email !== BULK_ROWS_OWNER_EMAIL
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `You can only add ${MAX_ROWS_PER_USER_REQUEST} rows at a time`,
        });
      }

      await checkTableOwner(ctx, input.tableId);

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
          // cells are created inside the database, with SQL-generated row ids
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
            INSERT INTO ${cells} (row_id, column_id, value)
            SELECT nr.id, cols.col_id,
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
