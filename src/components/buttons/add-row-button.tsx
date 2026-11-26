"use client";

import { PAGE_SIZE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import type { ColumnType, RowWithCells } from "@/types";
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
      const previousCount = Number(rowCount);

      // the new row goes at the very end, so it lives on the last page
      const pageParams = {
        ...queryParams,
        page: Math.floor(previousCount / PAGE_SIZE),
      };

      // Cancel so stale data can't overwrite our optimistic update
      await utils.row.getRows.cancel(pageParams);
      await utils.row.getRowCount.cancel({ tableId });

      const previousData = utils.row.getRows.getData(pageParams);

      const optimisticRow: RowWithCells = {
        id: newRow.id,
        tableId,
        cells: columns.map((col) => ({
          columnId: col.id,
          value: null,
        })),
      };

      utils.row.getRows.setData(pageParams, (old) => ({
        items: [...(old?.items ?? []), optimisticRow],
        totalFilteredCount: old?.totalFilteredCount,
      }));

      //  important!! if we do not increase the row count by 1, we never see this row. Thevirtual rows only show x length - we need to increase x by 1 for this row
      const newCount = previousCount + 1;
      utils.row.getRowCount.setData({ tableId }, newCount);

      return { pageParams, previousData, previousCount };
    },

    onError: (_err, _vars, ctx) => {
      if (!ctx) return;

      if (ctx.previousData) {
        utils.row.getRows.setData(ctx.pageParams, ctx.previousData);
      } else {
        void utils.row.getRows.invalidate(ctx.pageParams);
      }
      utils.row.getRowCount.setData({ tableId }, ctx.previousCount);
    },
  });

  const handleClick = useCallback(() => {
    if (notHydratedVirtualRows) return;

    addRow.mutate({ id: crypto.randomUUID(), tableId });
  }, [addRow, tableId, notHydratedVirtualRows]);

  return (
    <button
      data-testid="add-row-button"
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
