"use client";

import { useSavingStore } from "@/app/stores/use-saving-store";
import { api } from "@/trpc/react";
import type { TransformedRow } from "@/types/row";
import { useCallback, useRef } from "react";

interface Params {
  localRows: TransformedRow[];
  setLocalRows: React.Dispatch<React.SetStateAction<TransformedRow[]>>;
}

export function useCellCommitter({ localRows, setLocalRows }: Params) {
  const setIsSaving = useSavingStore((s) => s.setIsSaving);

  // Use ref to always have latest localRows without it being a dependency
  const localRowsRef = useRef(localRows);
  localRowsRef.current = localRows;

  const mutation = api.cell.upsertCell.useMutation({
    onMutate: ({ rowId, columnId }) => {
      setIsSaving(true);

      // Use ref to get current state
      const previousRows = localRowsRef.current;

      return { previousRows, rowId, columnId };
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousRows) {
        setLocalRows(context.previousRows);
      }
    },
    onSettled: () => {
      setIsSaving(false);
    },
  });

  // Wrap in useCallback with STABLE dependencies
  const commitCell = useCallback(
    (rowId: string, columnId: string, value: string | null) => {
      // Use ref to access current localRows
      const currentRows = localRowsRef.current;

      // Validate row exists (early exit if not found)
      const row = currentRows.find((r) => r._rowId === rowId);
      if (!row) {
        console.warn(`Row ${rowId} not found in local state`);
        return;
      }

      // Optimistic local update
      setLocalRows((prev) =>
        prev.map((r) => {
          if (r._rowId !== rowId) return r;

          const updatedCells = { ...r._cells, [columnId]: value };

          const cellId = r._cellMap[columnId];
          const updatedCellMap = cellId
            ? r._cellMap
            : { ...r._cellMap, [columnId]: `temp-${rowId}-${columnId}` };

          return {
            ...r,
            _cells: updatedCells,
            _cellMap: updatedCellMap,
          };
        }),
      );

      // Send to backend
      mutation.mutate({ rowId, columnId, value });
    },
    [mutation, setLocalRows],
  ); // Only depends on mutation and setLocalRows (both stable)

  return { commitCell };
}
