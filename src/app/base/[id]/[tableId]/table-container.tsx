import type { SortingState } from "@/app/base/[id]/[tableId]/page";
import { useSavingStore } from "@/app/stores/use-saving-store";
import {
  generateColumnDefinitions,
  transformRowsToTanStackFormat,
} from "@/components/columns/generate-column-definitions";
import { TableSidebar } from "@/components/table/table-sidebar";
import { TableToolbar } from "@/components/table/table-toolbar";
import { api } from "@/trpc/react";
import type { ColumnType } from "@/types/column";
import type { RowWithCells } from "@/types/row";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { Table } from "./table";

interface Props {
  tableId: string;
  columns: ColumnType[];
  rowsWithCells: RowWithCells[];
  rowCount: number;

  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;

  sorting: SortingState;
  onSortingChange: (sort: Props["sorting"]) => void;
}
export default function TableContainer({
  tableId,
  columns,
  rowsWithCells,
  rowCount,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  sorting,
  onSortingChange,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const setIsSaving = useSavingStore((state) => state.setIsSaving);

  const utils = api.useUtils();

  const updateCellMutation = api.column.updateCell.useMutation({
    onMutate: () => setIsSaving(true),
    onSuccess: () => {
      void utils.column.getColumns.invalidate({ tableId });
      void utils.row.getRowsInfinite.invalidate({ tableId });
    },
    onError: (error) => console.error("Failed to update cell:", error),
    onSettled: () => setIsSaving(false),
  });

  const onCellUpdate = useCallback(
    (cellId: string, value: string | null) => {
      updateCellMutation.mutate({ cellId, value });
    },
    [updateCellMutation],
  );

  const tanstackColumns = useMemo(
    () => generateColumnDefinitions(columns, rowsWithCells, onCellUpdate),
    [columns, rowsWithCells, onCellUpdate],
  );

  const transformedRows = useMemo(
    () => transformRowsToTanStackFormat(rowsWithCells),
    [rowsWithCells],
  );

  const table = useReactTable({
    data: transformedRows,
    columns: tanstackColumns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    state: {
      sorting: sorting
        ? [{ id: sorting.columnId, desc: sorting.direction === "desc" }]
        : [],
    },
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

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-slate-100">
      <TableToolbar
        sideBarState={[sidebarOpen, setSidebarOpen]}
        table={table}
      />

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
            transformedRows={transformedRows}
            columns={columns}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />
        </div>
      </div>
    </div>
  );
}
