import { DEFAULT_BASE_CONFIG, returnFakerData } from "@/lib/utils";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { cells, columns, rows, tables, views } from "@/server/db/schemas/bases";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const tableRouter = createTRPCRouter({
  // Create a new table
  createById: protectedProcedure
    .input(
      z.object({
        baseId: z.string(),
        tableId: z.string(),
        tableNumber: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.transaction(async (tx) => {
        const [table] = await tx
          .insert(tables)
          .values({
            baseId: input.baseId,
            id: input.tableId,
            name: `Table ${input.tableNumber}`,
          })
          .returning({ id: tables.id });

        if (!table) throw new Error("Failed to create base");

        // create active base
        await tx
          .insert(views)
          .values({ tableId: table.id, name: "Grid view", isActive: true });

        // 3. Create the columns
        const createdColumns = await tx
          .insert(columns)
          .values(
            DEFAULT_BASE_CONFIG.columns.map((col) => ({
              tableId: table.id,
              name: col.name,
              type: col.type,
              position: col.position,
            })),
          )
          .returning({
            id: columns.id,
            type: columns.type,
            name: columns.name,
          });

        // 4. Create the rows (position will auto-increment via serial)
        const rowValues = Array.from(
          { length: DEFAULT_BASE_CONFIG.defaultRowCount },
          () => ({ tableId: table.id }),
        );

        const createdRows = await tx.insert(rows).values(rowValues).returning();

        // 5. Create the cells (3 rows × 6 columns = 18 cells)
        const cellsToCreate = [];
        for (const row of createdRows) {
          for (const column of createdColumns) {
            cellsToCreate.push({
              rowId: row.id,
              columnId: column.id,
              value: returnFakerData(column.type, column.name),
            });
          }
        }

        await tx.insert(cells).values(cellsToCreate);

        return { table };
      });

      return result;
    }),

  // update name
  updateNameById: protectedProcedure
    .input(z.object({ tableId: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [table] = await ctx.db
        .update(tables)
        .set({ name: input.name })
        .where(eq(tables.id, input.tableId))
        .returning();

      if (!table) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found",
        });
      }

      return table;
    }),

  getTableWithViews: protectedProcedure
    .input(z.object({ tableId: z.string() }))
    .query(async ({ ctx, input }) => {
      const table = await ctx.db.query.tables.findFirst({
        where: eq(tables.id, input.tableId),
        columns: {
          id: true,
          name: true,
        },
        with: {
          views: {
            orderBy: (views, { asc }) => [asc(views.createdAt)],
          },
        },
      });

      if (!table) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found",
        });
      }

      return table;
    }),

  deleteTableById: protectedProcedure
    .input(z.object({ tableId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(tables)
        .where(eq(tables.id, input.tableId))
        .returning();

      return { success: true };
    }),
});
