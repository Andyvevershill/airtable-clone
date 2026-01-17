import z from "zod";
import type { Cell } from "./cell";

const rowSchema = z.object({
  id: z.string(),
  tableId: z.string(),
});

export type Row = z.infer<typeof rowSchema>;

export type RowWithCells = Row & { cells: Cell[] };

export type TransformedRow = {
  _rowId: string;
  _position: number;
  _cells: Record<string, string | number | null>;
  _cellMap: Record<string, string>;
};
