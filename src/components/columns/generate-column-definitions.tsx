import { DataTableColumnHeader } from "@/app/base/[id]/[tableId]/data-table-column-header";
import type { ColumnType } from "@/types/column";
import type { RowWithCells, TransformedRow } from "@/types/row";
import type { CellContext, ColumnDef } from "@tanstack/react-table";
import EditableCell from "../table/editable-cell";

function EditableCellRenderer(props: CellContext<TransformedRow, unknown>) {
  const { column } = props;
  const meta = column.columnDef.meta!;

  return (
    <EditableCell
      {...props}
      columnId={column.id}
      dataType={meta.dataType}
      onCellUpdate={meta.onCellUpdate}
    />
  );
}

export function generateColumnDefinitions(
  dbColumns: ColumnType[],
  onCellEdit: (rowId: string, columnId: string, value: string | null) => void,
): ColumnDef<TransformedRow>[] {
  return dbColumns.map((col) => ({
    id: col.id,
    accessorFn: (row) => row._cells[col.id],

    meta: {
      label: col.name,
      dataType: col.type,
      onCellUpdate: onCellEdit,
    },

    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={col.name}
        dataType={col.type}
      />
    ),

    cell: EditableCellRenderer,
  }));
}

export function transformRowsToTanStackFormat(
  rows: RowWithCells[],
): TransformedRow[] {
  return rows.map((row) => {
    const transformedRow: TransformedRow = {
      _rowId: row.id,
      _cells: {},
      _cellMap: {},
    };

    row.cells.forEach((cell) => {
      transformedRow._cells[cell.columnId] = cell.value;
      transformedRow._cellMap[cell.columnId] = cell.id;
    });

    return transformedRow;
  });
}
