import z from "zod";

const cellSchema = z.object({
  id: z.string(),
  rowId: z.string(),
  columnId: z.string(),
  value: z.string().nullable(),
});

export type Cell = z.infer<typeof cellSchema>;
