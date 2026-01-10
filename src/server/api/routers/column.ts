import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { cells, columns, rows } from "@/server/db/schemas";
import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const columnRouter = createTRPCRouter({
  getTableColumns: protectedProcedure
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
            value: faker.animal.crocodilia(),
          })),
        );
      }

      return newColumn;
    }),
});
