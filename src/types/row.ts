import z from "zod";

const rowSchema = z.object({
  id: z.string(),
  tableId: z.string(),
});

export type Row = z.infer<typeof rowSchema>;

export type RowWithCells = Row & {
  cells: { columnId: string; value: string | null }[];
};

export type TransformedRow = {
  _rowId: string;
  _index: number;
  _cells: Record<string, string | null>;
};

//{
//   _rowId: "klmnopqr12345678",  // Actual row ID
//   _index: 1203,                // position in the whole table (not just the page)
//   _cells: {
//     "col-1": null,
//     "col-2": null,
//     "col-3": null
//   },
// }
