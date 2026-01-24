import z from "zod";

const rowSchema = z.object({
  id: z.string(),
  tableId: z.string(),
});

export type Row = z.infer<typeof rowSchema>;

export type TransformedRow = {
  _rowId: string;
  _cells: Record<string, string | null>;
  _cellMap: Record<string, string>;
};

//{
//   _rowId: "klmnopqr12345678",  // Actual row ID
//   _cells: {
//     "col-1": null,
//     "col-2": null,
//     "col-3": null
//   },
//   _cellMap: {
//     "col-1": "col-1_klmnopqr12345678",  // Cell ID pattern
//     "col-2": "col-2_klmnopqr12345678",
//     "col-3": "col-3_klmnopqr12345678"
//   }
// }
