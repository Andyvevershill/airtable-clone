import z from "zod";
import type { Cell } from "./cell";
import type { GlobalSearchMatches } from "./view";

const rowSchema = z.object({
  id: z.string(),
  tableId: z.string(),
});

export type Row = z.infer<typeof rowSchema>;

export type RowWithCells = Row & { cells: Cell[] };

export type TransformedRow = {
  _rowId: string;
  _cells: Record<string, string | number | null>;
  _cellMap: Record<string, string>;
};

export type InfiniteRowsPage = {
  items: RowWithCells[];
  searchMatches: GlobalSearchMatches;
  totalFilteredCount: number;
  nextCursor?: number;
};
