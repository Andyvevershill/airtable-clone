"use client";

import { useLoadingStore } from "@/app/stores/use-loading-store";
import { useGlobalSearchStore } from "@/app/stores/use-search-store";
import { CreateColumnDropdown } from "@/components/dropdowns/create-column-dropdown";
import { TableBody } from "@/components/table/table-body";
import { TableFooter } from "@/components/table/table-footer";
import { TableHeader } from "@/components/table/table-header";
import { useTableKeyboardNavigation } from "@/hooks/use-table-keyboard-nav";
import type { ColumnType } from "@/types/column";
import type { TransformedRow } from "@/types/row";
import type { GlobalSearchMatches } from "@/types/view";
import type {
  ColumnFiltersState,
  SortingState,
  Table,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

/* ---------------- helpers ---------------- */

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

const ROW_HEIGHT = 32;

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

  const matchedColumnIdSet = useMemo(() => {
    const set = new Set<string>();
    for (const match of globalSearchMatches.matches) {
      if (match.type === "column") {
        set.add(match.columnId);
      }
    }
    return set;
  }, [globalSearchMatches.matches]);

  const matchedCellIdSet = useMemo(() => {
    const set = new Set<string>();
    for (const match of globalSearchMatches.matches) {
      if (match.type === "cell") {
        set.add(match.cellId);
      }
    }
    return set;
  }, [globalSearchMatches.matches]);

  const matchedRowIndexSet = useMemo(() => {
    const set = new Set<number>();
    for (const match of globalSearchMatches.matches) {
      if (match.type === "cell") {
        set.add(match.rowIndex);
      }
    }
    return set;
  }, [globalSearchMatches.matches]);

  useEffect(() => {
    if (!activeMatch || !scrollRef.current || !tableRef.current) return;

    const scrollToMatch = () => {
      if (activeMatch.type === "cell") {
        const rowIndex = activeMatch.rowIndex;

        if (rowIndex !== -1) {
          rowVirtualizer.scrollToIndex(rowIndex, {
            align: "center",
            behavior: "smooth",
          });

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
    totalCols: columns.length + 1,
  });

  return (
    <>
      <div
        className="relative flex h-full w-full flex-col bg-slate-100"
        style={{
          width: tableWidth ? `${tableWidth + 200}px` : "100%",
          minWidth: "100%",
        }}
      >
        <div ref={scrollRef} className="relative flex-1 overflow-auto">
          <div className="relative inline-block min-w-full pr-16 align-top">
            <div className="pointer-events-none sticky top-0 z-40">
              <div
                className="pointer-events-auto absolute top-0 flex h-[28px] w-23.5 items-center justify-center border-b border-l border-gray-200 bg-white shadow-[inset_0_-1px_0_0_rgb(229,231,235)] hover:bg-gray-50"
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
              <TableHeader
                table={table}
                activeMatch={activeMatch}
                matchedColumnIdSet={matchedColumnIdSet}
              />

              <TableBody
                rowVirtualizer={rowVirtualizer}
                table={table}
                activeMatch={activeMatch}
                matchedCellIdSet={matchedCellIdSet}
                matchedRowIndexSet={matchedRowIndexSet}
              />

              <TableFooter
                tableId={tableId}
                columns={columns}
                sorting={sorting}
                filters={filters}
              />
            </table>
          </div>
        </div>
      </div>

      {/* RECORDS BAR - Outside the width-constrained div */}
      <div className="sticky bottom-0 z-20 border-t border-gray-300 bg-white px-3 py-2">
        <div className="text-xs text-gray-600">
          {rowCount} {rowCount === 1 ? "record" : "records"}
          {isFetchingNextPage && " – Loading more…"}
        </div>
      </div>
    </>
  );
}
