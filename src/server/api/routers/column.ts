import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { columns } from "@/server/db/schemas";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

export const columnRouter = createTRPCRouter({
  addColumn: protectedProcedure
    .input(
      z.object({
        tableId: z.string(),
        name: z.string(),
        type: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const maxPositionResult = await ctx.db
        .select({ maxPosition: sql<number>`max(position)` })
        .from(columns)
        .where(eq(columns.tableId, input.tableId));

      const maxPosition = maxPositionResult[0]?.maxPosition ?? -1;

      const [column] = await ctx.db
        .insert(columns)
        .values({
          tableId: input.tableId,
          name: input.name,
          type: input.type,
          position: maxPosition + 1,
        })
        .returning();

      return column;
    }),
});
