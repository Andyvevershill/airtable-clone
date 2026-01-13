import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { cells } from "@/server/db/schemas";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const cellRouter = createTRPCRouter({
  updateCell: protectedProcedure
    .input(
      z.object({
        cellId: z.string(),
        value: z.string() || z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get current max position
      await ctx.db
        .update(cells)
        .set({ value: input.value })
        .where(eq(cells.id, input.cellId));

      return;
    }),
});
