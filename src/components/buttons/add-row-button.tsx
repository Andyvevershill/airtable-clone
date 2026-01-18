import type { InfiniteData } from "@tanstack/react-query";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import { type inferRouterOutputs } from "@trpc/server";
import { memo, useCallback, useMemo } from "react";
import { AiOutlinePlus } from "react-icons/ai";

import { useGlobalSearchStore } from "@/app/stores/use-search-store";
import {
  translateFiltersState,
  translateSortingState,
} from "@/lib/helper-functions";
import type { AppRouter } from "@/server/api/root";
import { api } from "@/trpc/react";
import type { ColumnType } from "@/types";

/* ────────────────────────────────────────────────────────────── */
/* Types                                                          */
/* ────────────────────────────────────────────────────────────── */

type RouterOutput = inferRouterOutputs<AppRouter>;
type RowsPage = RouterOutput["row"]["getRowsInfinite"];
type InfiniteRowsData = InfiniteData<RowsPage, number | null>;
type Row = RowsPage["items"][number];

/* ────────────────────────────────────────────────────────────── */

interface Props {
  tableId: string;
  sorting: SortingState;
  filters: ColumnFiltersState;
  columns: ColumnType[];
}

function AddRowButton({ tableId, sorting, filters, columns }: Props) {
  const { globalSearch } = useGlobalSearchStore();
  const utils = api.useUtils();

  /* Query key */
  const queryKey = useMemo(
    () => ({
      tableId,
      limit: 3000,
      sorting: translateSortingState(sorting, columns),
      filters: translateFiltersState(filters, columns),
      globalSearch,
    }),
    [tableId, sorting, filters, columns, globalSearch],
  );

  const addRow = api.row.addRow.useMutation({
    /* ───────── Optimistic add ───────── */
    onMutate: async (newRow) => {
      await utils.row.getRowsInfinite.cancel(queryKey);

      const previousData = utils.row.getRowsInfinite.getInfiniteData(queryKey);

      utils.row.getRowsInfinite.setInfiniteData(
        queryKey,
        (old: InfiniteRowsData | undefined) => {
          if (!old?.pages?.[0]) return old;

          const firstPage = old.pages[0];

          const optimisticRow: Row = {
            id: newRow.id,
            tableId,
            position: firstPage.items.length,
            cells: [],
          };

          return {
            ...old,
            pages: [
              {
                ...firstPage,
                items: [...firstPage.items, optimisticRow],
              },
              ...old.pages.slice(1),
            ],
          };
        },
      );

      return { previousData, rowId: newRow.id };
    },

    /* ───────── Rollback ───────── */
    onError: (_err, _vars, ctx) => {
      if (ctx?.previousData) {
        utils.row.getRowsInfinite.setInfiniteData(queryKey, ctx.previousData);
      }
    },

    /* ───────── Replace optimistic row ───────── */
    onSuccess: (serverRow, _vars, ctx) => {
      if (!ctx?.rowId) return;

      utils.row.getRowsInfinite.setInfiniteData(
        queryKey,
        (old: InfiniteRowsData | undefined) => {
          if (!old?.pages?.[0]) return old;

          const firstPage = old.pages[0];

          const items = firstPage.items.map((row) =>
            row.id === ctx.rowId ? serverRow : row,
          );

          return {
            ...old,
            pages: [{ ...firstPage, items }, ...old.pages.slice(1)],
          };
        },
      );

      /* keep count in sync */
      const updated = utils.row.getRowsInfinite.getInfiniteData(queryKey);

      const count =
        updated?.pages.reduce((sum, p) => sum + p.items.length, 0) ?? 0;

      utils.row.getRowCount.setData({ tableId }, count);
    },
  });

  const handleClick = useCallback(() => {
    addRow.mutate({
      id: crypto.randomUUID(),
      tableId,
    });
  }, [addRow, tableId]);

  return (
    <button
      className="pointer flex h-full w-full items-center justify-start pl-2 hover:bg-gray-50"
      title="Add row"
      onClick={handleClick}
    >
      <AiOutlinePlus size={16} className="text-gray-600" />
    </button>
  );
}

export default memo(AddRowButton);
