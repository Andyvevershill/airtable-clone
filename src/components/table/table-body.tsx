import { cn } from "@/lib/utils";
import type { TransformedRow } from "@/types/row";
import type { GlobalSearchMatches } from "@/types/view";
import { flexRender, type Table } from "@tanstack/react-table";
import type { Virtualizer } from "@tanstack/react-virtual";
import { Skeleton } from "../ui/skeleton";

const MIN_COL_WIDTH = 175;
const ROW_HEIGHT = 32;
const GUTTER_WIDTH = 70;

interface TableBodyProps {
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
  table: Table<TransformedRow>;
  activeMatch: GlobalSearchMatches["matches"][number] | undefined;
  matchedCellIdSet: Set<string>;
  matchedRowIndexSet: Set<number>;
}

export function TableBody({
  rowVirtualizer,
  table,
  activeMatch,
  matchedCellIdSet,
  matchedRowIndexSet,
}: TableBodyProps) {
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
        if (!tanstackRow) return null;

        return (
          <tr
            key={tanstackRow.id}
            data-index={virtualRow.index}
            ref={(node) => rowVirtualizer.measureElement(node)}
            className="w-full hover:bg-gray-50"
            style={{
              position: "absolute",
              transform: `translateY(${virtualRow.start}px)`,
              height: ROW_HEIGHT,
            }}
          >
            {/* FAKE GUTTER CELL */}
            <td
              className={cn(
                "border-t-0 border-b border-gray-200 p-0 text-xs text-gray-500",
                matchedRowIndexSet.has(virtualRow.index) && "bg-[#FFF3D3]",
              )}
              style={{
                width: GUTTER_WIDTH,
                minWidth: GUTTER_WIDTH,
              }}
            >
              <span className="ml-2 block">{virtualRow.index + 1}</span>
            </td>

            {tanstackRow.getVisibleCells().map((cell, index) => {
              const rows = table.getRowModel().rows;
              const tanstackRow = rows[virtualRow.index];

              const isBeyondLoadedRows = virtualRow.index >= rows.length;

              // Unloaded page → skeleton
              if (!tanstackRow && isBeyondLoadedRows) {
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

              const isActiveCell =
                activeMatch?.type === "cell" && activeMatch.cellId === cell.id;

              return (
                <td
                  key={cell.id}
                  data-cell-id={cell.id}
                  //  UI styling for search/sort/filter results
                  className={cn(
                    "overflow-hidden border border-t-0 border-gray-200 p-0 transition-colors",
                    index === 0 && "border-l-0",
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
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              );
            })}
          </tr>
        );
      })}
    </tbody>
  );
}
