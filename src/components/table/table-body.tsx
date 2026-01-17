import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { TransformedRow } from "@/types/row";
import type { GlobalSearchMatches } from "@/types/view";
import { flexRender, type Cell, type Table } from "@tanstack/react-table";
import type { Virtualizer } from "@tanstack/react-virtual";

const TABLE_CONFIG = {
  MIN_COL_WIDTH: 175,
  ROW_HEIGHT: 32,
  GUTTER_WIDTH: 70,
} as const;

interface TableBodyProps {
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
  table: Table<TransformedRow>;
  activeMatch: GlobalSearchMatches["matches"][number] | undefined;
  matchedCellIdSet: Set<string>;
  matchedRowIndexSet: Set<number>;
  isFetchingNextPage: boolean;
}

export function TableBody({
  rowVirtualizer,
  table,
  activeMatch,
  matchedCellIdSet,
  matchedRowIndexSet,
  isFetchingNextPage,
}: TableBodyProps) {
  //  Check if a cell is active in search
  const isCellActive = (cellId: string): boolean => {
    return activeMatch?.type === "cell" && activeMatch.cellId === cellId;
  };

  // Get gutter cell classes
  const getGutterCellClasses = (isMatchedRow: boolean): string => {
    return cn(
      "border-t border-b border-gray-200 p-0 text-xs text-gray-700",
      isMatchedRow && "bg-[#FFF3D3]",
    );
  };

  // Get data cell classes
  const getDataCellClasses = (
    cell: Cell<TransformedRow, unknown>,
    index: number,
    isActive: boolean,
  ): string => {
    return cn(
      "overflow-hidden border border-gray-200 p-0 transition-colors",
      index === 0 && "border-l-0",
      cell.column.getIsFiltered() && "bg-[#ebfbec]",
      cell.column.getIsSorted() &&
        !cell.column.getIsFiltered() &&
        "bg-[#FFF2EA]",
      matchedCellIdSet.has(cell.id) && "bg-[#FFF3D3]",
      isActive && "bg-[#f1cf6b]",
    );
  };

  return (
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

        // Render skeleton rows when fetching more data
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
                height: TABLE_CONFIG.ROW_HEIGHT,
              }}
            >
              {/* Skeleton Gutter Cell */}
              <td
                className="border-t border-b border-gray-200 p-0"
                style={{
                  width: TABLE_CONFIG.GUTTER_WIDTH,
                  minWidth: TABLE_CONFIG.GUTTER_WIDTH,
                }}
              >
                <div className="flex h-full w-full items-center justify-center">
                  <Skeleton className="h-3 w-8 rounded-sm" />
                </div>
              </td>

              {/* Skeleton Data Cells */}
              {visibleColumns.map((column) => (
                <td
                  key={column.id}
                  className="h-full w-full overflow-hidden border border-gray-200 p-0"
                  style={{
                    minWidth: TABLE_CONFIG.MIN_COL_WIDTH,
                    width: column.getSize(),
                    height: TABLE_CONFIG.ROW_HEIGHT,
                  }}
                >
                  <div className="flex h-full w-full items-center px-3">
                    <Skeleton className="h-3 w-full max-w-[90%] rounded-sm" />
                  </div>
                </td>
              ))}
            </tr>
          );
        }

        // If no row data and not loading, skip
        if (!tanstackRow) {
          return null;
        }

        const isMatchedRow = matchedRowIndexSet.has(virtualRow.index);

        return (
          <tr
            key={tanstackRow.id}
            data-index={virtualRow.index}
            ref={(node) => rowVirtualizer.measureElement(node)}
            className="w-full hover:bg-gray-50"
            style={{
              position: "absolute",
              transform: `translateY(${virtualRow.start}px)`,
              height: TABLE_CONFIG.ROW_HEIGHT,
            }}
          >
            {/* Fake Cell (Row Number) */}
            <td
              className={getGutterCellClasses(isMatchedRow)}
              style={{
                width: TABLE_CONFIG.GUTTER_WIDTH,
                minWidth: TABLE_CONFIG.GUTTER_WIDTH,
              }}
            >
              <span className="ml-2 block">{virtualRow.index + 1}</span>
            </td>

            {/* Data Cells */}
            {tanstackRow.getVisibleCells().map((cell, index) => {
              const isActive = isCellActive(cell.id);

              return (
                <td
                  key={cell.id}
                  data-cell-id={cell.id}
                  className={getDataCellClasses(cell, index, isActive)}
                  style={{
                    minWidth: TABLE_CONFIG.MIN_COL_WIDTH,
                    width: cell.column.getSize(),
                    height: TABLE_CONFIG.ROW_HEIGHT,
                  }}
                >
                  <div tabIndex={0} className="h-full w-full">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                </td>
              );
            })}
          </tr>
        );
      })}
    </tbody>
  );
}
