"use client";

import { useSavingStore } from "@/app/stores/use-saving-store";
import { api } from "@/trpc/react";
import type { TransformedRow } from "@/types/row";
import { useRef } from "react";

interface Params {
  localRows: TransformedRow[];
  setLocalRows: React.Dispatch<React.SetStateAction<TransformedRow[]>>;
}

export function useCellCommitter({ localRows, setLocalRows }: Params) {
  const setIsSaving = useSavingStore((s) => s.setIsSaving);

  // protects against out-of-order mutation responses
  const inflightVersions = useRef<Record<string, number>>({});

  const mutation = api.column.updateCell.useMutation({
    onMutate: () => {
      setIsSaving(true);
    },
    onError: () => {
      setIsSaving(false);
    },
    onSettled: () => {
      setIsSaving(false);
    },
  });

  const commitCell = (
    rowId: string,
    columnId: string,
    value: string | null,
    onSettled?: () => void,
  ) => {
    const row = localRows.find((r) => r._rowId === rowId);
    const cellId = row?._cellMap[columnId];

    if (!cellId) {
      console.warn("Missing cellId", rowId, columnId);
      return;
    }

    // 1️⃣ optimistic UI update (source of truth while editing)
    setLocalRows((prev) =>
      prev.map((r) =>
        r._rowId === rowId
          ? { ...r, _cells: { ...r._cells, [columnId]: value } }
          : r,
      ),
    );

    // 2️⃣ mutation versioning (race safety)
    const version = (inflightVersions.current[cellId] ?? 0) + 1;
    inflightVersions.current[cellId] = version;

    mutation.mutate(
      { cellId, value },
      {
        onSuccess: () => {
          // ignore stale responses
          if (inflightVersions.current[cellId] !== version) return;

          // OPTIONAL: background sync only (non-destructive)
          // utils.row.getRowsInfinite.invalidate({ tableId });
        },
        onSettled: () => {
          onSettled?.();
        },
      },
    );
  };

  return { commitCell };
}
