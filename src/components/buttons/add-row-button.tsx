"use client";

import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import type { ColumnType, TransformedRow } from "@/types";
import type { QueryParams } from "@/types/view";
import { memo, useCallback } from "react";
import { AiOutlinePlus } from "react-icons/ai";

interface Props {
  queryParams: QueryParams;
  tableId: string;
  notHydratedVirtualRows: boolean;
  columns: ColumnType[];
  rowCount: number;
}

function AddRowButton({
  queryParams,
  tableId,
  notHydratedVirtualRows,
  columns,
  rowCount,
}: Props) {
  const utils = api.useUtils();

  const addRow = api.row.addRow.useMutation({
    onMutate: async (newRow) => {
      // Cancel ALL queries to prevent stale data from overwriting our optimistic update
      await utils.row.getRowsInfinite.cancel(queryParams);
      await utils.row.getRowCount.cancel({ tableId });

      const previousData =
        utils.row.getRowsInfinite.getInfiniteData(queryParams);
      const previousCount = Number(rowCount);

      if (!previousData?.pages?.[0]) {
        return { previousData, rowId: newRow.id, previousCount };
      }

      const optimisticRow: TransformedRow = {
        _rowId: newRow.id,
        _cells: Object.fromEntries(columns.map((col) => [col.id, null])),
        _cellMap: Object.fromEntries(
          columns.map((col) => [col.id, `${col.id}_${newRow.id}`]),
        ),
      };

      utils.row.getRowsInfinite.setInfiniteData(queryParams, (old) => {
        if (!old) return old;

        const updatedPages = [...old.pages];
        const lastPage = old.pages[old.pages.length - 1];

        if (!lastPage) return old;

        updatedPages[old.pages.length - 1] = {
          ...lastPage,
          items: [...lastPage.items, optimisticRow],
          searchMatches: lastPage.searchMatches ?? { matches: [] },
          totalFilteredCount: lastPage.totalFilteredCount
            ? lastPage.totalFilteredCount + 1
            : undefined,
        };

        return { ...old, pages: updatedPages };
      });

      const newCount = previousCount + 1;
      utils.row.getRowCount.setData({ tableId }, newCount);

      return { previousData, rowId: newRow.id, previousCount };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previousData) {
        utils.row.getRowsInfinite.setInfiniteData(
          queryParams,
          ctx.previousData,
        );
      }
      if (ctx?.previousCount !== undefined) {
        utils.row.getRowCount.setData({ tableId }, ctx.previousCount);
      }
    },
  });

  const handleClick = useCallback(() => {
    if (notHydratedVirtualRows) return;

    addRow.mutate({ id: crypto.randomUUID(), tableId });
  }, [addRow, tableId, notHydratedVirtualRows]);

  return (
    <button
      disabled={notHydratedVirtualRows}
      title={
        notHydratedVirtualRows
          ? "Please wait until all rows finish loading"
          : "Add row"
      }
      className={cn(
        "flex h-full w-full items-center justify-start pl-2",
        notHydratedVirtualRows
          ? "cursor-not-allowed opacity-50"
          : "pointer hover:bg-gray-50",
      )}
      onClick={handleClick}
    >
      <AiOutlinePlus size={16} className="text-gray-600" />
    </button>
  );
}

export default memo(AddRowButton);
