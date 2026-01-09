import { z } from "zod";
import type { Cell } from "./cell";
import type { Column } from "./collumn";
import type { Row } from "./row";

const tableSchema = z.object({
  id: z.string(),
  baseId: z.string(),

  name: z.string(),
  description: z.string().nullable(),
  isFavourite: z.boolean(),

  lastAccessedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});

export type Table = z.infer<typeof tableSchema>;

export type FullTableData = Table & {
  columns: Column[];
  rows: (Row & {
    cells: Cell[];
  })[];
};
