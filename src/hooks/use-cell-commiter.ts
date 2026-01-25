"use client";

import { useSavingStore } from "@/app/stores/use-saving-store";
import { api } from "@/trpc/react";
import type { QueryParams } from "@/types/view";
import { useCallback } from "react";

interface Params {
  queryParams: QueryParams;
}

export function useCellCommitter({ queryParams }: Params) {
  const setIsSaving = useSavingStore((s) => s.setIsSaving);
  const utils = api.useUtils();

  const mutation = api.cell.upsertCell.useMutation({
    onMutate: async ({ rowId, columnId, value }) => {
      setIsSaving(true);

      // Cancel ongoing fetches for THIS exact query
      await utils.row.getRowsInfinite.cancel(queryParams);

      const previousData =
        utils.row.getRowsInfinite.getInfiniteData(queryParams);

      // Optimistically update only the affected cell
      utils.row.getRowsInfinite.setInfiniteData(queryParams, (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((row) => {
              if (row.id !== rowId) return row;

              return {
                ...row,
                cells: {
                  ...row.cells,
                  [columnId]: value,
                },
              };
            }),
          })),
        };
      });

      return { previousData };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previousData) {
        utils.row.getRowsInfinite.setInfiniteData(
          queryParams,
          ctx.previousData,
        );
      }
    },

    onSettled: () => {
      setIsSaving(false);
    },
  });

  const commitCell = useCallback(
    (rowId: string, columnId: string, value: string | null) => {
      mutation.mutate({ rowId, columnId, value });
    },
    [mutation],
  );

  return { commitCell };
}
