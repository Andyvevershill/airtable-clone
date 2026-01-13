import AddRowButton from "@/components/buttons/add-row-button";
import { CreateColumnDropdown } from "@/components/dropdowns/create-column-dropdown";
import type { ColumnType } from "@/types/column";
import type { TransformedRow } from "@/types/row";
import { flexRender, type Table } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

interface Props {
  table: Table<TransformedRow>;
  tableId: string;
  columns: ColumnType[];
  rowCount: number;
  transformedRows: TransformedRow[];

  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
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
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [tableWidth, setTableWidth] = useState(0);

  useLayoutEffect(() => {
    if (!tableRef.current) return;
    const update = () => setTableWidth(tableRef.current!.offsetWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(tableRef.current);
    return () => observer.disconnect();
  }, []);

  const rowVirtualizer = useVirtualizer({
    count: transformedRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 30,
  });

  const lastFetchedIndex = useRef<number>(-1);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const virtualItems = rowVirtualizer.getVirtualItems();
    if (virtualItems.length === 0) return;

    const lastItem = virtualItems[virtualItems.length - 1];

    if (!lastItem) return;

    if (
      lastItem.index >= transformedRows.length - 20 &&
      lastItem.index !== lastFetchedIndex.current
    ) {
      lastFetchedIndex.current = lastItem.index;
      fetchNextPage();
    }
  });

  useEffect(() => {
    lastFetchedIndex.current = -1;
  }, [transformedRows.length]);

  const { rows: tableRows } = table.getRowModel();

  const handleTableKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const target = e.target as HTMLElement;

      if (target.tagName === "INPUT") return;

      const cell = target.closest("td");
      if (!cell) return;

      const row = cell.closest("tr");
      if (!row) return;

      const rowIndex = parseInt(row.getAttribute("data-index") ?? "0");
      const colIndex = Array.from(row.children).indexOf(cell);

      const totalRows = transformedRows.length;
      const totalCols = columns.length;

      let nextRow = rowIndex;
      let nextCol = colIndex;
      let shouldNavigate = false;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          nextRow = Math.max(0, rowIndex - 1);
          shouldNavigate = true;
          break;
        case "ArrowDown":
          e.preventDefault();
          nextRow = Math.min(totalRows - 1, rowIndex + 1);
          shouldNavigate = true;
          break;
        case "ArrowLeft":
          e.preventDefault();
          nextCol = Math.max(0, colIndex - 1);
          shouldNavigate = true;
          break;
        case "ArrowRight":
          e.preventDefault();
          nextCol = Math.min(totalCols - 1, colIndex + 1);
          shouldNavigate = true;
          break;
        case "Tab":
          e.preventDefault();
          nextCol = colIndex + (e.shiftKey ? -1 : 1);
          if (nextCol >= totalCols) {
            nextCol = 0;
            nextRow = Math.min(totalRows - 1, rowIndex + 1);
          } else if (nextCol < 0) {
            nextCol = totalCols - 1;
            nextRow = Math.max(0, rowIndex - 1);
          }
          shouldNavigate = true;
          break;
      }

      if (shouldNavigate) {
        setTimeout(() => {
          const nextRowEl = tableRef.current?.querySelector(
            `tr[data-index="${nextRow}"]`,
          );
          const nextCellDiv =
            nextRowEl?.children[nextCol]?.querySelector<HTMLElement>(
              "div[tabindex]",
            );
          nextCellDiv?.focus();
        }, 0);
      }
    },
    [transformedRows.length, columns.length],
  );

  return (
    <div
      className="relative flex h-full w-full flex-col bg-slate-100"
      style={{ width: tableWidth ? `${tableWidth + 200}px` : "100%" }}
    >
      <div ref={scrollRef} className="relative flex-1 overflow-auto">
        <div className="relative inline-block min-w-full pr-16 align-top">
          <table
            ref={tableRef}
            className="border-collapse bg-white"
            onKeyDown={handleTableKeyDown}
          >
            <thead className="class sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="overflow-hidden border border-gray-200 bg-white px-3 py-2 text-left text-[13px] font-normal text-gray-700 hover:bg-gray-50"
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

                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className="absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none select-none hover:bg-blue-500"
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
                    data-index={virtualRow.index}
                    className="w-full hover:bg-gray-50"
                    style={{
                      position: "absolute",
                      transform: `translateY(${virtualRow.start}px)`,
                      height: ROW_HEIGHT,
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="overflow-hidden border border-gray-200 p-0"
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
                    ))}
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
                  <AddRowButton tableId={tableId} />
                </td>
              </tr>
            </tfoot>
          </table>

          <div
            className="pointer absolute top-0 z-20 h-9.25 w-23.5 border-y border-r border-gray-200 bg-white p-0 hover:bg-gray-50"
            style={{ left: tableWidth }}
          >
            <CreateColumnDropdown tableId={tableId} />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-300 bg-white px-3 py-2">
        <div className="text-xs text-gray-600">
          {rowCount} {rowCount === 1 ? "record" : "records"}
          {isFetchingNextPage && " – Loading more…"}
        </div>
      </div>
    </div>
  );
}
