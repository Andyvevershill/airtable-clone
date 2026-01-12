import { DataTableColumnHeader } from "@/app/base/[id]/[tableId]/data-table-column-header";
import type { ColumnType } from "@/types/column";
import type { RowWithCells, TransformedRow } from "@/types/row";
import type { ColumnDef } from "@tanstack/react-table";
import EditableCell from "../table/editable-cell";

export function generateColumnDefinitions(
  dbColumns: ColumnType[],
  rows: RowWithCells[],
  onCellUpdate: (cellId: string, value: string | null) => void,
): ColumnDef<TransformedRow>[] {
  return dbColumns.map((col) => ({
    accessorKey: col.id,
    size: 175,
    meta: {
      label: col.name,
      dataType: col.type,
    },

    enableSorting: true,
    enableColumnFilter: true,
    enableHiding: true,

    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={col.name}
        dataType={col.type}
      />
    ),

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
