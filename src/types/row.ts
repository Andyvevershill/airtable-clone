import z from "zod";
import type { Cell } from "./cell";

const rowSchema = z.object({
  id: z.string(),
  tableId: z.string(),

  position: z.number(),

  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});

export type Row = z.infer<typeof rowSchema>;

export type RowWithCells = Row & { cells: Cell[] };

// type we transform RowsWithCells into
export type TransformedRow = {
  _rowId: string;
  _position: number;
  [columnId: string]: string | null | number;
};
