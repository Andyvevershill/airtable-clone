import { useCallback, type RefObject } from "react";

interface UseTableKeyboardNavigationParams {
  tableRef: RefObject<HTMLTableElement | null>;
  totalRows: number;
  totalCols: number;
}

export function useTableKeyboardNavigation({
  tableRef,
  totalRows,
  totalCols,
}: UseTableKeyboardNavigationParams) {
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
    [tableRef, totalRows, totalCols],
  );

  return { handleTableKeyDown };
}
