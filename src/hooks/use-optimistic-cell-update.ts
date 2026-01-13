"use client";

import { useSavingStore } from "@/app/stores/use-saving-store";
import { api } from "@/trpc/react";
import type { TransformedRow } from "@/types/row";

interface Params {
  tableId: string;
  localRows: TransformedRow[];
  setLocalRows: React.Dispatch<React.SetStateAction<TransformedRow[]>>;
}

export function useOptimisticCellUpdate({
  tableId,
  localRows,
  setLocalRows,
}: Params) {
  const setIsSaving = useSavingStore((state) => state.setIsSaving);
  const utils = api.useUtils();

  const updateCell = api.column.updateCell.useMutation({
    // We removed onMutate optimistic cache update completely
    // → this is the #1 reason for edit kicking / cursor jumping

    onMutate: () => {
      // Still show saving indicator immediately
      setIsSaving(true);
    },

    onError: (_err, _vars, _ctx) => {
      setIsSaving(false);
      // You can optionally show error toast/badge per cell here
      // Many teams skip full rollback during editing
    },

    onSuccess: (_data, { cellId, value }) => {
      setIsSaving(false);

      // Now it's safe — update the query cache
      utils.row.getRowsInfinite.setInfiniteData(
        { tableId, limit: 250 },
        (old) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((row) => ({
                ...row,
                cells: row.cells.map((cell) =>
                  cell.id === cellId
                    ? { ...cell, value, updatedAt: new Date() }
                    : cell,
                ),
              })),
            })),
          };
        },
      );

      // Optional: also invalidate if you want fresh server data later
      // utils.row.getRowsInfinite.invalidate({ tableId });
    },

    // Optional: very useful during rapid typing
    onSettled: () => {
      setIsSaving(false);
    },
  });

  const onCellUpdate = (
    rowId: string,
    columnId: string,
    value: string | null,
  ) => {
    // 1. Instant local UI update — this is what user sees instantly
    setLocalRows((prev) =>
      prev.map((row) =>
        row._rowId === rowId
          ? {
              ...row,
              _cells: { ...row._cells, [columnId]: value },
            }
          : row,
      ),
    );

    // 2. Find cell id
    const row = localRows.find((r) => r._rowId === rowId);
    const cellId = row?._cellMap[columnId];

    if (!cellId) {
      console.warn("Missing cellId for", rowId, columnId);
      return;
    }

    // 3. Fire mutation — cache will be updated only on success
    updateCell.mutate({ cellId, value });
  };

  return { onCellUpdate };
}
