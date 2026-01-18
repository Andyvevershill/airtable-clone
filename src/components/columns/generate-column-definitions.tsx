import { DataTableColumnHeader } from "@/app/base/[id]/[tableId]/data-table-column-header";
import type { ColumnType } from "@/types/column";
import type { RowWithCells, TransformedRow } from "@/types/row";
import type { CellContext, ColumnDef } from "@tanstack/react-table";
import EditableCell from "../table/editable-cell";

/* ---------------------------------------------
 * Cell renderer
 * ------------------------------------------- */

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

/* ---------------------------------------------
 * Column definitions
 * ------------------------------------------- */

export function generateColumnDefinitions(
  dbColumns: ColumnType[],
  onCellEdit: (rowId: string, columnId: string, value: string | null) => void,
): ColumnDef<TransformedRow>[] {
  return dbColumns.map((col) => ({
    id: col.id,

    // TanStack will only read what it needs for visible rows
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

/* ---------------------------------------------
 * Row transformation (PURE)
 * ------------------------------------------- */
type Cell = {
  id: string;
  value: string | null;
  rowId: string;
  columnId: string;
};

export function transformRowsToTanStackFormat(
  rows: RowWithCells[],
): TransformedRow[] {
  return rows.map((row) => {
    const transformedRow: TransformedRow = {
      _rowId: row.id,
      _cells: {},
      _cellMap: {},
    };

    if (!row.cells) return transformedRow;

    // Handle BOTH array and object shapes with proper typing
    const cellsArray: Cell[] = Array.isArray(row.cells)
      ? row.cells
      : Object.values(row.cells);

    for (const cell of cellsArray) {
      transformedRow._cells[cell.columnId] = cell.value;
      transformedRow._cellMap[cell.columnId] = cell.id;
    }

    return transformedRow;
  });
}
