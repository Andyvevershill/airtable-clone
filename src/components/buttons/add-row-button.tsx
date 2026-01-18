import { useGlobalSearchStore } from "@/app/stores/use-search-store";
import {
  translateFiltersState,
  translateSortingState,
} from "@/lib/helper-functions";
import { api } from "@/trpc/react";
import type { ColumnType } from "@/types";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import { memo, useCallback } from "react";
import { AiOutlinePlus } from "react-icons/ai";

interface Props {
  tableId: string;
  sorting: SortingState;
  filters: ColumnFiltersState;
  columns: ColumnType[];
}

function AddRowButton({ tableId, sorting, filters, columns }: Props) {
  const { globalSearch } = useGlobalSearchStore();
  const utils = api.useUtils();

  const addRow = api.row.addRow.useMutation({
    onMutate: async (newRow) => {
      const queryKey = {
        tableId,
        limit: 5000,
        sorting: translateSortingState(sorting, columns),
        filters: translateFiltersState(filters, columns),
        globalSearch,
      };

      await utils.row.getRowsInfinite.cancel(queryKey);

      const previousData = utils.row.getRowsInfinite.getInfiniteData(queryKey);

      if (!previousData) {
        return { previousData: null, queryKey, rowId: newRow.id };
      }

      utils.row.getRowsInfinite.setInfiniteData(queryKey, (old) => {
        if (!old) return old;

        const optimisticRow = {
          id: newRow.id,
          tableId,
          position: old.pages[0]?.items.length ?? 0,
          cells: [],
        };

        return {
          ...old,
          pages: old.pages.map((page, index) =>
            index === 0
              ? { ...page, items: [...page.items, optimisticRow] }
              : page,
          ),
        };
      });

      return { previousData, queryKey, rowId: newRow.id };
    },

    onError: (err, _variables, context) => {
      if (context?.previousData && context?.queryKey) {
        utils.row.getRowsInfinite.setInfiniteData(
          context.queryKey,
          context.previousData,
        );
      }
    },

    onSuccess: (serverRow, _variables, context) => {
      if (!context?.previousData || !context?.rowId) {
        void utils.row.getRowsInfinite.invalidate({ tableId });
        void utils.row.getRowCount.invalidate({ tableId });
        return;
      }

      if (context.rowId !== serverRow.id) {
        void utils.row.getRowsInfinite.invalidate({ tableId });
        void utils.row.getRowCount.invalidate({ tableId });
        return;
      }

      const newRow = { ...serverRow, cells: [] };

      utils.row.getRowsInfinite.setInfiniteData(context.queryKey, (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page, i) => {
            if (i !== 0) return page;

            const lastIndex = page.items.length - 1;

            if (page.items[lastIndex]?.id === context.rowId) {
              const newItems = [...page.items];
              newItems[lastIndex] = newRow;
              return { ...page, items: newItems };
            }

            const rowIndex = page.items.findIndex(
              (item) => item.id === context.rowId,
            );

            if (rowIndex === -1) return page;

            const newItems = [...page.items];
            newItems[rowIndex] = newRow;
            return { ...page, items: newItems };
          }),
        };
      });

      const currentData = utils.row.getRowsInfinite.getInfiniteData(
        context.queryKey,
      );
      const actualItemCount =
        currentData?.pages.reduce((sum, page) => sum + page.items.length, 0) ??
        0;

      utils.row.getRowCount.setData({ tableId }, actualItemCount);
    },
  });

  const handleClick = useCallback(() => {
    const newId = crypto.randomUUID();
    addRow.mutate({ id: newId, tableId });
  }, [addRow, tableId]);

  return (
    <button
      className="pointer flex h-full w-full items-center justify-start pl-2 hover:bg-gray-50"
      title="Add row"
      onClick={handleClick}
      disabled={addRow.isPending}
    >
      <AiOutlinePlus size={16} className="text-gray-600" />
    </button>
  );
}

export default memo(AddRowButton);
