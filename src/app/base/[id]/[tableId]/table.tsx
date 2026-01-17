import { useLoadingStore } from "@/app/stores/use-loading-store";
import { useGlobalSearchStore } from "@/app/stores/use-search-store";
import AddRowButton from "@/components/buttons/add-row-button";
import { CreateColumnDropdown } from "@/components/dropdowns/create-column-dropdown";
import { Skeleton } from "@/components/ui/skeleton";
import { useTableKeyboardNavigation } from "@/hooks/use-table-keyboard-nav";
import { cn } from "@/lib/utils";
import type { ColumnType } from "@/types/column";
import type { TransformedRow } from "@/types/row";
import type { GlobalSearchMatches } from "@/types/view";
import {
  flexRender,
  type ColumnFiltersState,
  type SortingState,
  type Table,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

interface Props {
  table: Table<TransformedRow>;
  tableId: string;
  columns: ColumnType[];
  rowCount: number;
  transformedRows: TransformedRow[];

  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;

  sorting: SortingState;
  filters: ColumnFiltersState;
  globalSearchMatches: GlobalSearchMatches;
}

const MIN_COL_WIDTH = 175;
const ROW_HEIGHT = 33;

export function Table({
  table,
  tableId,
  columns,
  rowCount,
  transformedRows,

  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,

  sorting,
  filters,
  globalSearchMatches,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [tableWidth, setTableWidth] = useState(0);
  const { activeMatchIndex } = useGlobalSearchStore();
  const setIsLoading = useLoadingStore((state) => state.setIsLoading);

  const lastFetchedIndex = useRef<number>(-1);
  const activeMatch = globalSearchMatches.matches[activeMatchIndex];

  useEffect(() => {
    setIsLoading(isFetchingNextPage);
  }, [isFetchingNextPage, setIsLoading]);

  useLayoutEffect(() => {
    if (!tableRef.current) return;
    const update = () => setTableWidth(tableRef.current!.offsetWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(tableRef.current);
    return () => observer.disconnect();
  }, []);

  const isFiltering = table.getState().columnFilters.length > 0;
  const effectiveRowCount = isFiltering ? transformedRows.length : rowCount;

  const rowVirtualizer = useVirtualizer({
    count: effectiveRowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 80,
  });

  // UI changes for search results
  const matchedColumnIdSet = useMemo(() => {
    const set = new Set<string>();
    for (const match of globalSearchMatches.matches) {
      if (match.type === "column") {
        set.add(match.columnId);
      }
    }
    return set;
  }, [globalSearchMatches.matches]);

  // UI changes for matches in cells
  const matchedCellIdSet = useMemo(() => {
    const set = new Set<string>();
    for (const match of globalSearchMatches.matches) {
      if (match.type === "cell") {
        set.add(match.cellId);
      }
    }
    return set;
  }, [globalSearchMatches.matches]);

  useEffect(() => {
    if (!activeMatch || !scrollRef.current || !tableRef.current) return;

    const scrollToMatch = () => {
      if (activeMatch.type === "cell") {
        // For cell matches, scroll to the row
        const rowIndex = transformedRows.findIndex(
          (row) => row._rowId === activeMatch.rowId,
        );

        if (rowIndex !== -1) {
          rowVirtualizer.scrollToIndex(rowIndex, {
            align: "center",
            behavior: "smooth",
          });

          // Also scroll horizontally to the column if needed
          setTimeout(() => {
            const cellElement = tableRef.current?.querySelector(
              `[data-cell-id="${activeMatch.cellId}"]`,
            );
            if (cellElement && scrollRef.current) {
              cellElement.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "center",
              });
            }
          }, 100);
        }
      } else if (activeMatch.type === "column") {
        // For column matches, just scroll horizontally to the header
        const headerElement = tableRef.current?.querySelector(
          `th[data-column-id="${activeMatch.columnId}"]`,
        );
        if (headerElement && scrollRef.current) {
          headerElement.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }
      }
    };

    // Small delay to ensure rendering is complete
    const timeoutId = setTimeout(scrollToMatch, 50);
    return () => clearTimeout(timeoutId);
  }, [activeMatch, activeMatchIndex, transformedRows, rowVirtualizer]);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const checkPrefetch = () => {
      if (!hasNextPage || isFetchingNextPage) return;

      const items = rowVirtualizer.getVirtualItems();
      if (items.length < 5) return;

      const lastIndex = items[items.length - 1]?.index ?? 0;
      const prefetchThreshold = transformedRows.length - 7500;

      if (lastIndex >= prefetchThreshold) {
        if (lastFetchedIndex.current !== lastIndex) {
          lastFetchedIndex.current = lastIndex;
          fetchNextPage();
        }
      }
    };

    checkPrefetch();

    const throttledCheck = throttle(checkPrefetch, 150);
    scrollElement.addEventListener("scroll", throttledCheck);

    return () => {
      scrollElement.removeEventListener("scroll", throttledCheck);
    };
  }, [
    rowVirtualizer,
    transformedRows.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  useEffect(() => {
    lastFetchedIndex.current = -1;
  }, [transformedRows.length]);

  const { handleTableKeyDown } = useTableKeyboardNavigation({
    tableRef,
    totalRows: transformedRows.length,
    totalCols: columns.length,
  });

  return (
    <div
      className="relative flex h-full w-full flex-col bg-slate-100"
      style={{ width: tableWidth ? `${tableWidth + 200}px` : "100%" }}
    >
      <div ref={scrollRef} className="relative flex-1 overflow-auto">
        <div className="relative inline-block min-w-full pr-16 align-top">
          <div className="pointer-events-none sticky top-0 z-40">
            <div
              className="pointer-events-auto absolute top-0 flex h-9 w-23.5 items-center justify-center border-b border-l border-gray-200 bg-white shadow-[inset_0_-1px_0_0_rgb(229,231,235)] hover:bg-gray-50"
              style={{ left: tableWidth }}
            >
              <CreateColumnDropdown tableId={tableId} />
            </div>
          </div>

          <table
            ref={tableRef}
            className="border-collapse bg-white"
            onKeyDown={handleTableKeyDown}
          >
            <thead className="sticky top-0 z-20 bg-white">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const isActiveColumn =
                      activeMatch?.type === "column" &&
                      activeMatch.columnId === header.id;

                    return (
                      <th
                        key={header.id}
                        data-column-id={header.id}
                        className={cn(
                          "relative overflow-hidden border-r border-gray-200 bg-white px-3 py-2 text-left text-[13px] font-medium text-gray-700 shadow-[inset_0_-1px_0_0_rgb(229,231,235)] hover:bg-gray-50",

                          header.column.getIsFiltered() && "bg-[#F6FBF7]",
                          header.column.getIsSorted() &&
                            !header.column.getIsFiltered() &&
                            "bg-[#FAF5F2]",
                          matchedColumnIdSet.has(header.id) && "bg-[#FFF3D3]",
                          isActiveColumn && "bg-[#f1cf6b]",
                        )}
                        style={{
                          minWidth: MIN_COL_WIDTH,
                          width: header.getSize(),
                          position: "relative",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}

                        <div className="absolute top-0 right-0 h-full w-1 touch-none select-none" />
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            <tbody
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                position: "relative",
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const rows = table.getRowModel().rows;
                const tanstackRow = rows[virtualRow.index];

                const isBeyondLoadedRows = virtualRow.index >= rows.length;

                if (!tanstackRow && isBeyondLoadedRows && isFetchingNextPage) {
                  const visibleColumns = table.getVisibleFlatColumns();

                  return (
                    <tr
                      key={`skeleton-${virtualRow.index}`}
                      data-index={virtualRow.index}
                      className="w-full"
                      style={{
                        position: "absolute",
                        transform: `translateY(${virtualRow.start}px)`,
                        height: ROW_HEIGHT,
                      }}
                    >
                      {visibleColumns.map((column) => (
                        <td
                          key={column.id}
                          className="h-full w-full overflow-hidden border border-gray-200 p-0"
                          style={{
                            minWidth: MIN_COL_WIDTH,
                            width: column.getSize(),
                            height: ROW_HEIGHT,
                            maxWidth: column.getSize(),
                          }}
                        >
                          <div className="flex h-full w-full items-center justify-center">
                            <Skeleton className="h-3 w-full max-w-[90%] rounded-sm p-0" />
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                }

                if (!tanstackRow) {
                  return null;
                }

                return (
                  <tr
                    key={tanstackRow.id}
                    ref={(node) => rowVirtualizer.measureElement(node)}
                    data-index={virtualRow.index}
                    className="w-full hover:bg-gray-50"
                    style={{
                      position: "absolute",
                      transform: `translateY(${virtualRow.start}px)`,
                      height: ROW_HEIGHT,
                    }}
                  >
                    {tanstackRow.getVisibleCells().map((cell) => {
                      const isActiveCell =
                        activeMatch?.type === "cell" &&
                        activeMatch.cellId === cell.id;

                      return (
                        <td
                          key={cell.id}
                          data-cell-id={cell.id}
                          className={cn(
                            "overflow-hidden border border-gray-200 p-0 transition-colors",

                            cell.column.getIsFiltered() && "bg-[#ebfbec]",
                            cell.column.getIsSorted() &&
                              !cell.column.getIsFiltered() &&
                              "bg-[#FFF2EA]",

                            matchedCellIdSet.has(cell.id) && "bg-[#FFF3D3]",
                            isActiveCell && "bg-[#f1cf6b]",
                          )}
                          style={{
                            minWidth: MIN_COL_WIDTH,
                            width: cell.column.getSize(),
                            height: ROW_HEIGHT,
                            maxWidth: cell.column.getSize(),
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>

            <tfoot>
              <tr>
                <td
                  colSpan={columns.length}
                  className="pointer h-8 border border-gray-200 bg-white p-0"
                >
                  <AddRowButton
                    tableId={tableId}
                    sorting={sorting}
                    filters={filters}
                    columns={columns}
                  />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
