"use client";

import {
  generateColumnDefinitions,
  transformRowsToTanStackFormat,
} from "@/components/columns/generate-column-definitions";
import { TableSidebar } from "@/components/table/table-sidebar";
import { TableToolbar } from "@/components/table/table-toolbar";
import { useCellCommitter } from "@/hooks/use-cell-commiter";
import type { RowWithCells, TableWithViews, TransformedRow } from "@/types";
import type { ColumnType } from "@/types/column";
import {
  getCoreRowModel,
  useReactTable,
  type ColumnFiltersState,
  type OnChangeFn,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { useEffect, useMemo, useRef, useState } from "react";
import { Table } from "./table";

interface Props {
  tableWithViews: TableWithViews;
  columns: ColumnType[];
  rowCount: number;
  rowsWithCells: RowWithCells[];

  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;

  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
}

export default function TableContainer({
  tableWithViews,
  columns,
  rowCount,
  rowsWithCells,

  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,

  sorting,
  onSortingChange,
  columnFilters,
  onColumnFiltersChange,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const editingCellRef = useRef<{
    rowId: string;
    columnId: string;
  } | null>(null);

  const [localColumns, setLocalColumns] = useState<ColumnType[]>(columns);
  const [localRows, setLocalRows] = useState(
    transformRowsToTanStackFormat(rowsWithCells),
  );

  useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  useEffect(() => {
    const transformed = transformRowsToTanStackFormat(rowsWithCells);

    if (!editingCellRef.current) {
      setLocalRows(transformed);
    } else {
      const { rowId: editingRowId, columnId: editingColumnId } =
        editingCellRef.current;

      setLocalRows((prevRows) =>
        transformed.map((newRow): TransformedRow => {
          if (newRow._rowId === editingRowId) {
            const prevRow = prevRows.find((r) => r._rowId === newRow._rowId);

            if (prevRow) {
              const preservedValue = prevRow._cells[editingColumnId];

              return {
                ...newRow,
                _cells: {
                  ...newRow._cells,
                  [editingColumnId]: preservedValue ?? null,
                },
              };
            }
          }

          return newRow;
        }),
      );
    }
  }, [rowsWithCells]);

  const { commitCell } = useCellCommitter({
    localRows,
    setLocalRows,
  });

  const tanstackColumns = useMemo(() => {
    return generateColumnDefinitions(localColumns, commitCell);
  }, [localColumns, commitCell]);

  const table = useReactTable({
    data: localRows,
    columns: tanstackColumns,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,

    manualSorting: true,
    manualFiltering: true,

    onSortingChange,
    onColumnFiltersChange,

    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  const sidebarState: [boolean, (v: boolean) => void] = useMemo(
    () => [sidebarOpen, setSidebarOpen],
    [sidebarOpen],
  );

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-slate-100">
      <TableToolbar sideBarState={sidebarState} table={table} />

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <div className="shrink-0">
            <TableSidebar
              sidebarOpen={sidebarOpen}
              tableWithViews={tableWithViews}
            />
          </div>
        )}

        <div className="flex-1 overflow-x-scroll">
          <Table
            table={table}
            tableId={tableWithViews.id}
            rowCount={rowCount}
            transformedRows={localRows}
            columns={localColumns}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />
        </div>
      </div>
    </div>
  );
}
