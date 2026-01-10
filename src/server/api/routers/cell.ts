import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { columns } from "@/server/db/schemas";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const callRouter = createTRPCRouter({
  UPDATE: protectedProcedure
    .input(
      z.object({
        tableId: z.string(),
        name: z.string(),
        type: z.enum(["text", "number"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get current max position
      const maxPosition = await ctx.db.query.columns.findFirst({
        where: eq(columns.tableId, input.tableId),
        orderBy: (columns, { desc }) => [desc(columns.position)],
      });

      const newColumn = await ctx.db.insert(columns).values({
        tableId: input.tableId,
        name: input.name,
        type: input.type,
        position: (maxPosition?.position ?? -1) + 1,
        createdAt: new Date(),
      });

      return newColumn;
    }),
});
