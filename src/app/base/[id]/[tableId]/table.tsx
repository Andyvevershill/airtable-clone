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
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";

const TABLE_CONFIG = {
  MIN_COL_WIDTH: 175,
  ROW_HEIGHT: 32,
  GUTTER_WIDTH: 70,
  OVERSCAN: 80,
  PREFETCH_THRESHOLD: 7500,
  SCROLL_THROTTLE_MS: 150,
} as const;

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

// SEARCH MATCH FUNCTIONS

function createMatchedColumnSet(matches: GlobalSearchMatches["matches"]) {
  const set = new Set<string>();
  for (const match of matches) {
    if (match.type === "column") {
      set.add(match.columnId);
    }
  }
  return set;
}

function createMatchedCellSet(matches: GlobalSearchMatches["matches"]) {
  const set = new Set<string>();
  for (const match of matches) {
    if (match.type === "cell") {
      set.add(match.cellId);
    }
  }
  return set;
}

function createMatchedRowIndexSet(matches: GlobalSearchMatches["matches"]) {
  const set = new Set<number>();
  for (const match of matches) {
    if (match.type === "cell") {
      set.add(match.rowIndex);
    }
  }
  return set;
}

// HOOKS

function useTableWidth(tableRef: RefObject<HTMLTableElement | null>) {
  const [tableWidth, setTableWidth] = useState(0);

  useLayoutEffect(() => {
    if (!tableRef.current) return;

    const update = () => setTableWidth(tableRef.current!.offsetWidth);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(tableRef.current);

    return () => observer.disconnect();
  }, []);

  return tableWidth;
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
  const lastFetchedIndexRef = useRef<number>(-1);

  const { activeMatchIndex } = useGlobalSearchStore();
  const setIsLoading = useLoadingStore((state) => state.setIsLoading);
  const activeMatch = globalSearchMatches.matches[activeMatchIndex];
  const isFiltering = table.getState().columnFilters.length > 0;
  const effectiveRowCount = isFiltering ? transformedRows.length : rowCount;

  //  Calculate table container width
  const getContainerWidth = (): string => {
    return tableWidth ? `${tableWidth + 200}px` : "100%";
  };

  const tableWidth = useTableWidth(tableRef);

  const rowVirtualizer = useVirtualizer({
    count: effectiveRowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => TABLE_CONFIG.ROW_HEIGHT,
    overscan: TABLE_CONFIG.OVERSCAN,
  });

  const matchedColumnIdSet = useMemo(
    () => createMatchedColumnSet(globalSearchMatches.matches),
    [globalSearchMatches.matches],
  );

  const matchedCellIdSet = useMemo(
    () => createMatchedCellSet(globalSearchMatches.matches),
    [globalSearchMatches.matches],
  );

  const matchedRowIndexSet = useMemo(
    () => createMatchedRowIndexSet(globalSearchMatches.matches),
    [globalSearchMatches.matches],
  );

  const { handleTableKeyDown } = useTableKeyboardNavigation({
    tableRef,
    totalRows: transformedRows.length,
    totalCols: columns.length,
  });

  useEffect(() => {
    setIsLoading(isFetchingNextPage);
  }, [isFetchingNextPage, setIsLoading]);

  //  Active Match Scrolling
  useEffect(() => {
    if (!activeMatch || !scrollRef.current || !tableRef.current) return;

    const scrollToMatch = () => {
      if (activeMatch.type === "cell") {
        const activeRowIndex = activeMatch.rowIndex;

        if (activeMatch.rowIndex !== -1) {
          rowVirtualizer.scrollToIndex(activeRowIndex, {
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

  //Infinite Scroll Prefetch
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const checkPrefetch = () => {
      if (!hasNextPage || isFetchingNextPage) return;

      const items = rowVirtualizer.getVirtualItems();
      if (items.length < 5) return;

      const lastIndex = items[items.length - 1]?.index ?? 0;
      const prefetchThreshold =
        transformedRows.length - TABLE_CONFIG.PREFETCH_THRESHOLD;

      if (lastIndex >= prefetchThreshold) {
        if (lastFetchedIndexRef.current !== lastIndex) {
          lastFetchedIndexRef.current = lastIndex;
          fetchNextPage();
        }
      }
    };

    checkPrefetch();
    const throttledCheck = throttle(
      checkPrefetch,
      TABLE_CONFIG.SCROLL_THROTTLE_MS,
    );
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

  //  Reset Prefetch Tracking
  useEffect(() => {
    lastFetchedIndexRef.current = -1;
  }, [transformedRows.length]);

  return (
    <div
      className="relative flex h-full w-full flex-col bg-slate-100"
      style={{ width: getContainerWidth() }}
    >
      <div ref={scrollRef} className="relative flex-1 overflow-auto">
        <div className="relative inline-block min-w-full pr-16 align-top">
          {/* Add Column Button - Sticky positioned outside table */}
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
              isFetchingNextPage={isFetchingNextPage}
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
  );
}
