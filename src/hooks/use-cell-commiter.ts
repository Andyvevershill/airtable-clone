"use client";

import { useSavingStore } from "@/app/stores/use-saving-store";
import { api } from "@/trpc/react";
import type { TransformedRow } from "@/types/row";

interface Params {
  localRows: TransformedRow[];
  setLocalRows: React.Dispatch<React.SetStateAction<TransformedRow[]>>;
}

export function useCellCommitter({ localRows, setLocalRows }: Params) {
  const setIsSaving = useSavingStore((s) => s.setIsSaving);

  const mutation = api.column.updateCell.useMutation({
    onMutate: () => {
      setIsSaving(true);
    },
    onError: () => {},
    onSettled: () => {
      setIsSaving(false);
    },
  });

  const commitCell = (
    rowId: string,
    columnId: string,
    value: string | null,
  ) => {
    const row = localRows.find((r) => r._rowId === rowId);
    const cellId = row?._cellMap[columnId];

    if (!cellId) {
      console.warn("Missing cellId", rowId, columnId);
      return;
    }

    setLocalRows((prev) =>
      prev.map((r) =>
        r._rowId === rowId
          ? { ...r, _cells: { ...r._cells, [columnId]: value } }
          : r,
      ),
    );

    mutation.mutate({ cellId, value });
  };

  return { commitCell };
}
