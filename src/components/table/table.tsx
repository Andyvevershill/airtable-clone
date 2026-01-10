import { transformRowsToTanStackFormat } from "@/lib/utils";
import type { Column } from "@/types/column";
import type { RowWithCells } from "@/types/row";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import AddColumnButton from "../buttons/add-column-button";
import AddRowButton from "../buttons/add-row-button";
import { generateColumnDefinitions } from "./generate-column-definitions";

interface Props {
  tableId: string;
  columns: Column[];
  rows: RowWithCells[];
  rowCount: number;

  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
}

const MIN_COL_WIDTH = 150;
const ROW_HEIGHT = 33;

export function Table({
  tableId,
  columns,
  rows,
  rowCount,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: Props) {
  const transformedRows = useMemo(
    () => transformRowsToTanStackFormat(rows),
    [rows],
  );

  const handleCellUpdate = (cellId: string, value: string | null) => {
    console.log("Cell update:", cellId, value);
  };

  const tanstackColumns = useMemo(
    () => generateColumnDefinitions(columns, rows, handleCellUpdate),
    [columns, rows],
  );

  // ✅ KEYBOARD NAVIGATION STATE
  const [focusedCell, setFocusedCell] = useState<{
    rowIndex: number;
    colIndex: number;
  } | null>(null);

  const table = useReactTable({
    data: transformedRows,
    columns: tanstackColumns,
    getCoreRowModel: getCoreRowModel(),
    enableColumnResizing: true,
    columnResizeMode: "onChange",
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [tableWidth, setTableWidth] = useState(0);

  // Measure table width ONLY for add-column button positioning
  useLayoutEffect(() => {
    if (!tableRef.current) return;

    const update = () => {
      setTableWidth(tableRef.current!.offsetWidth);
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(tableRef.current);

    return () => observer.disconnect();
  }, []);

  // Virtual rows
  const rowVirtualizer = useVirtualizer({
    count: transformedRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  // ✅ INFINITE SCROLL
  const fetchMoreOnBottomReached = useCallback(
    (container?: HTMLDivElement | null) => {
      if (!container || !hasNextPage || isFetchingNextPage) return;

      const { scrollHeight, scrollTop, clientHeight } = container;

      if (scrollHeight - scrollTop - clientHeight < 500) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  useLayoutEffect(() => {
    fetchMoreOnBottomReached(scrollRef.current);
  }, [fetchMoreOnBottomReached]);

  const { rows: tableRows } = table.getRowModel();

  // ✅ KEYBOARD NAVIGATION HANDLER
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
      const totalRows = transformedRows.length;
      const totalCols = columns.length;

      let newRowIndex = rowIndex;
      let newColIndex = colIndex;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          newRowIndex = Math.max(0, rowIndex - 1);
          break;
        case "ArrowDown":
          e.preventDefault();
          newRowIndex = Math.min(totalRows - 1, rowIndex + 1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          newColIndex = Math.max(0, colIndex - 1);
          break;
        case "ArrowRight":
        case "Tab":
          e.preventDefault();
          newColIndex = colIndex + 1;
          if (newColIndex >= totalCols) {
            newColIndex = 0;
            newRowIndex = Math.min(totalRows - 1, rowIndex + 1);
          }
          break;
        case "Enter":
          e.preventDefault();
          // Enter moves down
          newRowIndex = Math.min(totalRows - 1, rowIndex + 1);
          break;
        default:
          return;
      }

      setFocusedCell({ rowIndex: newRowIndex, colIndex: newColIndex });

      // Focus the new cell
      setTimeout(() => {
        const cellId = `cell-${newRowIndex}-${newColIndex}`;
        const element = document.getElementById(cellId);
        if (element) {
          const input = element.querySelector("input, textarea");
          if (input instanceof HTMLElement) {
            input.focus();
          }
        }
      }, 0);
    },
    [transformedRows.length, columns.length],
  );

  return (
    <div className="relative flex h-full w-full flex-col bg-slate-100">
      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="relative flex-1 overflow-auto"
        onScroll={(e) => fetchMoreOnBottomReached(e.currentTarget)}
      >
        <div className="relative inline-block min-w-full align-top">
          {/* TABLE */}
          <table ref={tableRef} className="border-collapse bg-white">
            <thead className="sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="border border-gray-200 px-3 py-2 text-left text-[13px] font-normal text-gray-700 hover:bg-gray-50"
                      style={{
                        minWidth: MIN_COL_WIDTH,
                        width: header.getSize(),
                        position: "relative",
                        fontWeight: 500,
                      }}
                    >
                      {/* ✅ FIXED TRUNCATE - Reserve space for resize handle */}
                      <div className="truncate pr-2">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </div>

                      {/* Resize handle */}
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none select-none hover:bg-blue-500 ${
                          header.column.getIsResizing() ? "bg-blue-500" : ""
                        }`}
                      />
                    </th>
                  ))}
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
                const row = tableRows[virtualRow.index];
                if (!row) return null;

                return (
                  <tr
                    key={row.id}
                    ref={(node) => rowVirtualizer.measureElement(node)}
                    className="hover:bg-gray-50"
                    style={{
                      position: "absolute",
                      transform: `translateY(${virtualRow.start}px)`,
                      width: "100%",
                      height: ROW_HEIGHT,
                    }}
                  >
                    {row.getVisibleCells().map((cell, colIndex) => {
                      const isFocused =
                        focusedCell?.rowIndex === virtualRow.index &&
                        focusedCell?.colIndex === colIndex;

                      return (
                        <td
                          key={cell.id}
                          id={`cell-${virtualRow.index}-${colIndex}`}
                          className={`border border-gray-200 p-0 ${
                            isFocused ? "ring-2 ring-blue-500 ring-inset" : ""
                          }`}
                          style={{
                            minWidth: MIN_COL_WIDTH,
                            width: cell.column.getSize(),
                            height: ROW_HEIGHT,
                          }}
                          onKeyDown={(e) =>
                            handleKeyDown(e, virtualRow.index, colIndex)
                          }
                          onClick={() =>
                            setFocusedCell({
                              rowIndex: virtualRow.index,
                              colIndex,
                            })
                          }
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
                  className="pointer border border-gray-200 bg-white p-0"
                >
                  <AddRowButton tableId={tableId} />
                </td>
              </tr>
            </tfoot>
          </table>

          {/* ➕ ADD COLUMN BUTTON */}
          <div
            className="pointer absolute top-0 z-20 h-9.25 w-23.5 border-y border-r border-gray-200 bg-white p-0 hover:bg-gray-50"
            style={{ left: tableWidth }}
          >
            <AddColumnButton tableId={tableId} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 bg-white px-3 py-2">
        <div className="text-xs text-gray-600">
          {rows.length} of {rowCount} {rowCount === 1 ? "record" : "records"}
          {isFetchingNextPage && " – Loading more…"}
        </div>
      </div>
    </div>
  );
}
