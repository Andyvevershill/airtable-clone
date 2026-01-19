"use client";

import { useLoadingStore } from "@/app/stores/use-loading-store";
import { useGlobalSearchStore } from "@/app/stores/use-search-store";
import {
  generateColumnDefinitions,
  transformRowsToTanStackFormat,
} from "@/components/columns/generate-column-definitions";
import { TableSidebar } from "@/components/table/table-sidebar";
import { TableToolbar } from "@/components/table/table-toolbar";
import { useCellCommitter } from "@/hooks/use-cell-commiter";
import { useViewUpdater } from "@/hooks/use-view-updater";
import {
  applyViewToTableState,
  translateFiltersState,
  translateSortingState,
} from "@/lib/helper-functions";
import type { RowWithCells, TableWithViews } from "@/types";
import type { ColumnType } from "@/types/column";
import type { GlobalSearchMatches } from "@/types/view";
import {
  getCoreRowModel,
  useReactTable,
  type ColumnFiltersState,
  type OnChangeFn,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import type { User } from "better-auth";
import { useEffect, useMemo, useState } from "react";
import { LuLoaderPinwheel } from "react-icons/lu";
import { Table } from "./table";

interface Props {
  tableWithViews: TableWithViews;
  columns: ColumnType[];
  rowCount: number;
  rowsWithCells: RowWithCells[];
  user: User;

  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;

  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
  globalSearchMatches: GlobalSearchMatches;
}

export default function TableContainer({
  user,
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
  globalSearchMatches,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { globalSearch } = useGlobalSearchStore();
  const { isLoadingView, isFiltering, setIsLoadingView } = useLoadingStore();
  const [columnVisibility, onColumnVisibilityChange] =
    useState<VisibilityState>({});

  const activeView = useMemo(
    () => tableWithViews.views.find((v) => v.isActive),
    [tableWithViews.views],
  );

  useEffect(() => {
    if (!activeView?.id) return;

    applyViewToTableState(activeView, {
      onSortingChange,
      onColumnFiltersChange,
      onColumnVisibilityChange,
    });

    const MIN_DELAY = 200;
    const timer = setTimeout(() => {
      setIsLoadingView(false);
    }, MIN_DELAY);

    return () => clearTimeout(timer);
  }, [
    activeView?.id,
    onSortingChange,
    onColumnFiltersChange,
    onColumnVisibilityChange,
    setIsLoadingView,
  ]);

  useViewUpdater(
    activeView?.id ?? "",
    tableWithViews.id,
    { sorting, columnFilters, columnVisibility },
    columns,
  );

  // Memoize transformed data instead of using local state
  const tableData = useMemo(
    () => transformRowsToTanStackFormat(rowsWithCells),
    [rowsWithCells],
  );

  // Memoize query input for cell committer
  const rowsQueryInput = useMemo(
    () => ({
      tableId: tableWithViews.id,
      limit: 5000,
      sorting: translateSortingState(sorting, columns),
      filters: translateFiltersState(columnFilters, columns),
      globalSearch: globalSearch || undefined,
    }),
    [tableWithViews.id, sorting, columnFilters, columns, globalSearch],
  );

  const { commitCell } = useCellCommitter({
    rowsQueryInput,
  });

  const tanstackColumns = useMemo(() => {
    return generateColumnDefinitions(columns, commitCell);
  }, [columns, commitCell]);

  const table = useReactTable({
    data: tableData,
    columns: tanstackColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row._rowId,
    manualSorting: true,
    manualFiltering: true,
    onSortingChange,
    onColumnFiltersChange,
    onColumnVisibilityChange,
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
              user={user}
            />
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="relative flex-1 overflow-auto">
            {isLoadingView ? (
              <div className="inset-0 z-10 flex h-full w-full flex-col items-center justify-center bg-slate-100">
                <div className="flex flex-col items-center justify-center gap-6 text-gray-600">
                  <LuLoaderPinwheel size={22} className="animate-spin" />
                  <p className="text-sm text-gray-600">Loading this view...</p>
                </div>
              </div>
            ) : isFiltering ? (
              <div className="inset-0 z-10 flex h-full w-full items-center justify-center bg-slate-100">
                <div className="flex flex-col items-center justify-center gap-6 text-gray-600">
                  <LuLoaderPinwheel size={22} className="animate-spin" />
                </div>
              </div>
            ) : rowsWithCells.length === 0 && columnFilters.length > 0 ? (
              <div className="flex h-full items-center justify-center p-8 text-center">
                <div className="max-w-md">
                  <h3 className="text-md font-medium text-gray-800">
                    All records are filtered
                  </h3>

                  <button
                    onClick={() => onColumnFiltersChange([])}
                    className="pointer mt-6 rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Clear filters
                  </button>
                </div>
              </div>
            ) : (
              <Table
                table={table}
                tableId={tableWithViews.id}
                rowCount={rowCount}
                transformedRows={tableData}
                columns={columns}
                fetchNextPage={fetchNextPage}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                sorting={sorting}
                filters={columnFilters}
                globalSearchMatches={globalSearchMatches}
              />
            )}
          </div>

          {/* RECORDS BAR - Inside the table's flex container */}
          <div className="border-t border-gray-300 bg-white px-3 py-2">
            <div className="text-xs text-gray-600">
              {rowCount} {rowCount === 1 ? "record" : "records"}
              {isFetchingNextPage && " – Loading more…"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
