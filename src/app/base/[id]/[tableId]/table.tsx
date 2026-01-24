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
import type { GlobalSearchMatches, QueryParams } from "@/types/view";
import type { Table } from "@tanstack/react-table";
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
  rowsWithCells: TransformedRow[];
  queryParams: QueryParams;
  totalFilteredCount: number;

  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;

  globalSearchMatches: GlobalSearchMatches;
}

const ROW_HEIGHT = 32;

export function Table({
  table,
  tableId,
  columns,
  rowCount,
  rowsWithCells,
  queryParams,
  totalFilteredCount,

  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
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

  // this has been the cause of the optimistic row bug!!!!
  // make sure we also increase the rowCount by 1 in addRowButton, so we can actually see the last optimistic row we created!!!!!
  // we are having loads of white space of empty columns when filtering, this the fix?
  const isFiltering = table.getState().columnFilters.length > 0;
  const effectiveRowCount =
    isFiltering && totalFilteredCount !== undefined
      ? totalFilteredCount
      : rowCount;

  const rowVirtualizer = useVirtualizer({
    count: effectiveRowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 30,
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
  }, [activeMatch, activeMatchIndex, rowsWithCells, rowVirtualizer]);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const checkPrefetch = () => {
      // ✅ Early exit if already fetching or no more pages
      if (!hasNextPage || isFetchingNextPage) {
        return;
      }

      const items = rowVirtualizer.getVirtualItems();
      if (items.length < 5) return;

      const lastVisibleIndex = items[items.length - 1]?.index ?? 0;
      const prefetchThreshold = rowsWithCells.length - 200;

      if (lastVisibleIndex >= prefetchThreshold) {
        if (lastFetchedIndex.current !== lastVisibleIndex) {
          lastFetchedIndex.current = lastVisibleIndex;
          console.log("🚀 [Table] Fetching next page!");
          fetchNextPage();
        }
      }
    };

    const throttledCheck = throttle(checkPrefetch, 300);
    scrollElement.addEventListener("scroll", throttledCheck);

    return () => {
      scrollElement.removeEventListener("scroll", throttledCheck);
    };
  }, [
    rowVirtualizer,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    rowsWithCells.length,
  ]);

  useEffect(() => {
    lastFetchedIndex.current = -1;
  }, [rowsWithCells.length]);

  const { handleTableKeyDown } = useTableKeyboardNavigation({
    tableRef,
    totalRows: rowsWithCells.length,
    totalCols: columns.length + 1,
  });

  const loadedRowCount = table.getRowModel().rows.length;

  const notHydratedVirtualRows = rowVirtualizer
    .getVirtualItems()
    .some((v) => v.index >= loadedRowCount);

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
                notHydratedVirtualRows={notHydratedVirtualRows}
                queryParams={queryParams}
                effectiveRowCount={effectiveRowCount}
              />
            </table>
            <div className="h-30"></div>
          </div>
        </div>
      </div>
    </>
  );
}
