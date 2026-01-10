import z from "zod";

const columnSchema = z.object({
  id: z.string(),
  tableId: z.string(),

  name: z.string(),
  type: z.string(),
  position: z.number(),

  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});

export type Column = z.infer<typeof columnSchema>;
