// src/components/table/utils/generate-columns.ts

import type { Column } from "@/types/column";
import type { RowWithCells, TransformedRow } from "@/types/row";
import type { ColumnDef } from "@tanstack/react-table";

export function generateColumnDefinitions(
  dbColumns: Column[],
  rows: RowWithCells[],
  onCellUpdate: (cellId: string, value: string | null) => void,
): ColumnDef<TransformedRow>[] {
  return dbColumns.map((col) => ({
    accessorKey: col.id, // Use column ID as the key
    header: col.name, // Display column name in header

    // Render the cell based on column type
    cell: ({ row, getValue }) => {
      const value = getValue() as string | null;

      // Find the actual cell ID from the original row data
      const originalRow = rows.find((r) => r.id === row.original._rowId);
      const cell = originalRow?.cells.find((c) => c.columnId === col.id);

      if (!cell) return null;

      // For now, just render a simple input
      // Later we'll make this fancy with different cell types
      return (
        <input
          type={col.type === "number" ? "number" : "text"}
          value={value ?? ""}
          onChange={(e) => onCellUpdate(cell.id, e.target.value)}
          className="w-full border-none bg-transparent px-2 py-1 outline-none focus:bg-blue-50"
        />
      );
    },
  }));
}
