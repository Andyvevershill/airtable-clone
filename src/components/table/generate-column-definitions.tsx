import type { Column } from "@/types/column";
import type { RowWithCells, TransformedRow } from "@/types/row";
import type { ColumnDef } from "@tanstack/react-table";
import EditableCell from "./editable-cell";

export function generateColumnDefinitions(
  dbColumns: Column[],
  rows: RowWithCells[],
  onCellUpdate: (cellId: string, value: string | null) => void,
): ColumnDef<TransformedRow>[] {
  return dbColumns.map((col) => ({
    accessorKey: col.id,
    header: col.name,
    size: 175,
    cell: (props) => (
      <EditableCell
        {...props}
        rows={rows}
        columnId={col.id}
        onCellUpdate={onCellUpdate}
        dataType={col.type}
      />
    ),
  }));
}

export function transformRowsToTanStackFormat(
  rows: RowWithCells[],
): TransformedRow[] {
  return rows.map((row) => {
    const transformedRow: TransformedRow = {
      _rowId: row.id,
      _position: row.position,
    };

    // Add each cell value using columnId as the key
    row.cells.forEach((cell) => {
      transformedRow[cell.columnId] = cell.value;
    });

    return transformedRow;
  });
}
