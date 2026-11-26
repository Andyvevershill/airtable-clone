"use client";

import { CreateColumnDropdown } from "@/components/dropdowns/create-column-dropdown";
import { TableBody } from "@/components/table/table-body";
import { TableFooter } from "@/components/table/table-footer";
import { TableHeader } from "@/components/table/table-header";
import { useTableKeyboardNavigation } from "@/hooks/use-table-keyboard-nav";
import { useGlobalSearchStore } from "@/stores/use-search-store";
import type { ColumnType } from "@/types/column";
import type { TransformedRow } from "@/types/row";
import type { QueryParams, SearchMatch } from "@/types/view";
import type { Row, Table } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

interface Props {
  table: Table<TransformedRow>;
  tableId: string;
  columns: ColumnType[];
  effectiveRowCount: number;
  queryParams: QueryParams;
  loadRows: (startIndex: number, endIndex: number) => void;
  globalSearchMatches: SearchMatch[];
}

const ROW_HEIGHT = 32;
// load this many rows above/below the screen so scrolling a bit never shows skeletons
const PREFETCH_THRESHOLD = 250;
// wait for the scroll to settle so dragging the scrollbar doesn't fetch every page on the way
const SCROLL_SETTLE_MS = 100;

export function Table({
  table,
  tableId,
  columns,
  effectiveRowCount,
  queryParams,
  loadRows,
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

  // rows only hold the pages we've loaded, so look them up by their real index
  const coreRows = table.getRowModel().rows;
  const rowsByIndex = useMemo(() => {
    const map = new Map<number, Row<TransformedRow>>();
    for (const row of coreRows) {
      map.set(row.original._index, row);
    }
    return map;
  }, [coreRows]);

  // Scroll to active search match
  const activeMatch = globalSearchMatches[activeMatchIndex];
  // the matched row might be on a page we haven't loaded yet
  const activeRowLoaded =
    activeMatch?.type === "cell" && rowsByIndex.has(activeMatch.rowIndex);

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
  }, [activeMatch, activeMatchIndex, activeRowLoaded, rowVirtualizer]);

  // load whatever part of the table is on screen (any page, not just the next one)
  const virtualItems = rowVirtualizer.getVirtualItems();
  const firstVisibleIndex = virtualItems[0]?.index ?? 0;
  const lastVisibleIndex = virtualItems[virtualItems.length - 1]?.index ?? 0;

  useEffect(() => {
    if (effectiveRowCount === 0) return;

    const timeout = setTimeout(() => {
      loadRows(
        Math.max(0, firstVisibleIndex - PREFETCH_THRESHOLD),
        Math.min(effectiveRowCount - 1, lastVisibleIndex + PREFETCH_THRESHOLD),
      );
    }, SCROLL_SETTLE_MS);

    return () => clearTimeout(timeout);
  }, [firstVisibleIndex, lastVisibleIndex, effectiveRowCount, loadRows]);

  // Keyboard navigation
  const { handleTableKeyDown } = useTableKeyboardNavigation({
    tableRef,
    totalRows: effectiveRowCount,
    totalCols: columns.length + 1,
  });

  // Check if virtualised rows are hydrated (disable add row button if false)
  const notHydratedVirtualRows = virtualItems.some(
    (v) => !rowsByIndex.has(v.index),
  );

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
              rowsByIndex={rowsByIndex}
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
