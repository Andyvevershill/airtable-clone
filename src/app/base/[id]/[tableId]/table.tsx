"use client";

import { useGlobalSearchStore } from "@/app/stores/use-search-store";
import { CreateColumnDropdown } from "@/components/dropdowns/create-column-dropdown";
import { TableBody } from "@/components/table/table-body";
import { TableFooter } from "@/components/table/table-footer";
import { TableHeader } from "@/components/table/table-header";
import { useTableKeyboardNavigation } from "@/hooks/use-table-keyboard-nav";
import type { ColumnType } from "@/types/column";
import type { TransformedRow } from "@/types/row";
import type { QueryParams, SearchMatch } from "@/types/view";
import type { Table } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface Props {
  table: Table<TransformedRow>;
  tableId: string;
  columns: ColumnType[];
  rowCount: number;
  transformedRows: TransformedRow[];
  queryParams: QueryParams;
  totalFilteredCount: number;
  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  globalSearchMatches: SearchMatch[];
}

const ROW_HEIGHT = 32;
const PREFETCH_THRESHOLD = 200;
const SCROLL_THROTTLE_MS = 300;

export function Table({
  table,
  tableId,
  columns,
  rowCount,
  transformedRows,
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

  // Measure table width for fixed add column button (cowboy fix here)
  useLayoutEffect(() => {
    if (!tableRef.current) return;

    const updateWidth = () => setTableWidth(tableRef.current!.offsetWidth);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(tableRef.current);

    return () => observer.disconnect();
  }, []);

  // Calculate effective row count (filters may reduce total)
  const isFiltering = table.getState().columnFilters.length > 0;
  const effectiveRowCount =
    isFiltering && totalFilteredCount !== undefined
      ? totalFilteredCount
      : rowCount;

  // Virtual scrolling for performance with large datasets
  const rowVirtualizer = useVirtualizer({
    count: effectiveRowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 30,
  });

  // Build sets for O(1) lookup of matched cells/columns
  const { matchedColumnIdSet, matchedCellIdSet, matchedRowIndexSet } =
    useMemo(() => {
      const columnIds = new Set<string>();
      const cellIds = new Set<string>();
      const rowIndexes = new Set<number>();

      for (const match of globalSearchMatches) {
        if (match.type === "column") {
          columnIds.add(match.columnId);
        } else if (match.type === "cell") {
          cellIds.add(match.cellId);
          rowIndexes.add(match.rowIndex);
        }
      }

      return {
        matchedColumnIdSet: columnIds,
        matchedCellIdSet: cellIds,
        matchedRowIndexSet: rowIndexes,
      };
    }, [globalSearchMatches]);

  // Scroll to active search match
  const activeMatch = globalSearchMatches[activeMatchIndex];

  useEffect(() => {
    if (!activeMatch || !scrollRef.current || !tableRef.current) return;

    if (activeMatch.type === "cell") {
      const rowIndex = activeMatch.rowIndex;
      if (rowIndex === -1) return;

      // Scroll row into view vertically
      rowVirtualizer.scrollToIndex(rowIndex, {
        align: "center",
        behavior: "smooth",
      });

      // Scroll cell into view horizontally
      const cellElement = tableRef.current.querySelector(
        `[data-cell-id="${activeMatch.cellId}"]`,
      );
      cellElement?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    } else if (activeMatch.type === "column") {
      // Scroll column header into view
      const headerElement = tableRef.current.querySelector(
        `th[data-column-id="${activeMatch.columnId}"]`,
      );
      headerElement?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeMatch, activeMatchIndex, rowVirtualizer]);

  // Infinite scroll: fetch next page when user scrolls near bottom
  const lastFetchedIndexRef = useRef(-1);

  const checkAndFetchNextPage = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const items = rowVirtualizer.getVirtualItems();
    if (items.length === 0) return;

    const lastVisibleIndex = items[items.length - 1]?.index ?? 0;
    const shouldFetch =
      lastVisibleIndex >= transformedRows.length - PREFETCH_THRESHOLD;

    if (shouldFetch && lastFetchedIndexRef.current !== lastVisibleIndex) {
      lastFetchedIndexRef.current = lastVisibleIndex;
      fetchNextPage();
    }
  }, [
    hasNextPage,
    isFetchingNextPage,
    rowVirtualizer,
    transformedRows.length,
    fetchNextPage,
  ]);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    // Throttle scroll checks to avoid performance issues
    let throttleTimeout: NodeJS.Timeout | null = null;
    const handleScroll = () => {
      if (throttleTimeout) return;

      throttleTimeout = setTimeout(() => {
        checkAndFetchNextPage();
        throttleTimeout = null;
      }, SCROLL_THROTTLE_MS);
    };

    scrollElement.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [checkAndFetchNextPage]);

  // Reset fetch tracking when data changes
  useEffect(() => {
    lastFetchedIndexRef.current = -1;
  }, [transformedRows.length]);

  // Keyboard navigation
  const { handleTableKeyDown } = useTableKeyboardNavigation({
    tableRef,
    totalRows: transformedRows.length,
    totalCols: columns.length + 1,
  });

  // Check if virtualised rows are hydrated (disable add row button if false)
  const loadedRowCount = table.getRowModel().rows.length;
  const notHydratedVirtualRows = rowVirtualizer
    .getVirtualItems()
    .some((v) => v.index >= loadedRowCount);

  return (
    <div
      className="relative flex h-full w-full flex-col bg-slate-100"
      style={{
        width: tableWidth ? `${tableWidth + 200}px` : "100%",
        minWidth: "100%",
      }}
    >
      <div ref={scrollRef} className="relative flex-1 overflow-auto">
        <div className="relative inline-block min-w-full pr-16 align-top">
          {/* Fixed "Add Column" button */}
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

          <div className="h-30" />
        </div>
      </div>
    </div>
  );
}
