"use client";

import { useSavingStore } from "@/stores/use-saving-store";
import { api, type RouterOutputs } from "@/trpc/react";
import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { useCallback } from "react";

type RowsPage = RouterOutputs["row"]["getRows"];

interface Params {
  tableId: string;
}

export function useCellCommitter({ tableId }: Params) {
  const setIsSaving = useSavingStore((s) => s.setIsSaving);

  const utils = api.useUtils();
  const queryClient = useQueryClient();

  // pull out mutate - it's stable, the mutation object isn't (that was rebuilding every column after each edit)
  const { mutate } = api.cell.upsertCell.useMutation({
    onMutate: ({ rowId, columnId, value }) => {
      setIsSaving(true);

      // update the cell in every loaded page for this table (any sort/filter)
      const queryKey = getQueryKey(api.row.getRows, { tableId }, "query");

      queryClient.setQueriesData<RowsPage>({ queryKey }, (old) => {
        if (!old) return old;

        return {
          ...old,
          items: old.items.map((row) => {
            if (row.id !== rowId) return row;

            const hasCell = row.cells.some((c) => c.columnId === columnId);

            return {
              ...row,
              cells: hasCell
                ? row.cells.map((cell) =>
                    cell.columnId === columnId ? { ...cell, value } : cell,
                  )
                : [...row.cells, { columnId, value }],
            };
          }),
        };
      });
    },

    onError: () => {
      // put back whatever the server actually has
      void utils.row.getRows.invalidate({ tableId });
    },

    onSettled: () => {
      setIsSaving(false);
    },
  });

  const commitCell = useCallback(
    (rowId: string, columnId: string, value: string | null) => {
      mutate({ rowId, columnId, value });
    },
    [mutate],
  );

  return { commitCell };
}
