"use client";

import type { SortingState } from "@/app/base/[id]/[tableId]/page";
import {
  generateColumnDefinitions,
  transformRowsToTanStackFormat,
} from "@/components/columns/generate-column-definitions";
import { TableSidebar } from "@/components/table/table-sidebar";
import { TableToolbar } from "@/components/table/table-toolbar";
import { useOptimisticCellUpdate } from "@/hooks/use-optimistic-cell-update";
import type { RowWithCells, TransformedRow } from "@/types";
import type { ColumnType } from "@/types/column";
import {
  getCoreRowModel,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { useEffect, useMemo, useRef, useState } from "react";
import { Table } from "./table";

interface Props {
  tableId: string;
  columns: ColumnType[];
  rowCount: number;
  rowsWithCells: RowWithCells[];

  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;

  sorting: SortingState;
  onSortingChange: (sort: Props["sorting"]) => void;
}

export default function TableContainer({
  tableId,
  columns,
  rowCount,
  rowsWithCells,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  sorting,
  onSortingChange,
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

  const { onCellUpdate } = useOptimisticCellUpdate({
    tableId,
    localRows,
    setLocalRows,
  });

  const tanstackColumns = useMemo(
    () => generateColumnDefinitions(localColumns, onCellUpdate),
    [localColumns, onCellUpdate],
  );

  const table = useReactTable({
    data: localRows,
    columns: tanstackColumns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,

    state: {
      sorting: sorting
        ? [{ id: sorting.columnId, desc: sorting.direction === "desc" }]
        : [],
      columnVisibility,
    },

    onColumnVisibilityChange: setColumnVisibility,

    onSortingChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater(table.getState().sorting)
          : updater;

      const [sort] = next;
      if (!sort) {
        onSortingChange(null);
        return;
      }

      const column = table.getColumn(sort.id);
      const dataType = column?.columnDef.meta?.dataType ?? "string";

      onSortingChange({
        columnId: sort.id,
        direction: sort.desc ? "desc" : "asc",
        type: dataType === "number" ? "number" : "string",
      });
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
            <TableSidebar sidebarOpen={sidebarOpen} tableId={tableId} />
          </div>
        )}

        <div className="flex-1 overflow-x-scroll">
          <Table
            table={table}
            tableId={tableId}
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
