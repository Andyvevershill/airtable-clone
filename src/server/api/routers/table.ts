import { DEFAULT_BASE_CONFIG } from "@/lib/utils";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { cells, columns, rows, tables, views } from "@/server/db/schemas/bases";
import { faker } from "@faker-js/faker";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
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
          .returning();

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
              type: "string",
              position: col.position,
            })),
          )
          .returning();

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
              value: faker.location.cardinalDirection(),
            });
          }
        }

        await tx.insert(cells).values(cellsToCreate);

        return { table };
      });

      return result;
    }),

  // List all tables for current user (sorted by most recently accessed)
  getAll: protectedProcedure
    .input(z.object({ baseId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db
        .select()
        .from(tables)
        .where(eq(tables.baseId, input.baseId))
        .orderBy(desc(tables.lastAccessedAt));
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
        throw new Error("Table not found");
      }

      return table;
    }),

  // delete table
  deleteById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(tables).where(eq(tables.id, input.id)).returning();
    }),

  getTableWithViews: protectedProcedure
    .input(z.object({ tableId: z.string() }))
    .query(async ({ ctx, input }) => {
      const table = await ctx.db.query.tables.findFirst({
        where: eq(tables.id, input.tableId),
        with: {
          views: true,
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
});
