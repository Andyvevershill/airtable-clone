import { useGlobalSearchStore } from "@/app/stores/use-search-store";
import {
  translateFiltersState,
  translateSortingState,
} from "@/lib/helper-functions";
import { api } from "@/trpc/react";
import type { ColumnType } from "@/types";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import { memo, useCallback, useMemo } from "react";
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

  // Memoize query key to prevent recalculation on every render
  const queryKey = useMemo(
    () => ({
      tableId,
      limit: 5000,
      sorting: translateSortingState(sorting, columns),
      filters: translateFiltersState(filters, columns),
      globalSearch,
    }),
    [tableId, sorting, filters, columns, globalSearch],
  );

  const addRow = api.row.addRow.useMutation({
    onMutate: async (newRow) => {
      // Cancel any ongoing fetches
      await utils.row.getRowsInfinite.cancel(queryKey);

      // Get current data for rollback
      const previousData = utils.row.getRowsInfinite.getInfiniteData(queryKey);

      // If no data exists, skip optimistic update
      if (!previousData?.pages?.[0]) {
        return { previousData: null, rowId: newRow.id };
      }

      // Optimistically update the cache - only modify first page
      utils.row.getRowsInfinite.setInfiniteData(queryKey, (old) => {
        if (!old?.pages?.[0]) return old;

        const firstPage = old.pages[0];

        // Create optimistic row matching exact server structure
        const optimisticRow = {
          id: newRow.id,
          tableId,
          position: firstPage.items.length,
          createdAt: new Date(),
          updatedAt: null,
          cells: [],
        };

        // Only create new first page, reuse the rest for performance
        return {
          ...old,
          pages: [
            { ...firstPage, items: [...firstPage.items, optimisticRow] },
            ...old.pages.slice(1),
          ],
        };
      });

      // DON'T update count optimistically - let it sync from actual data
      // This prevents virtualizer from rendering empty space

      return { previousData, rowId: newRow.id };
    },

    onError: (err, _variables, context) => {
      // Rollback to previous data on error
      if (context?.previousData) {
        utils.row.getRowsInfinite.setInfiniteData(
          queryKey,
          context.previousData,
        );
      }

      // No need to rollback count since we don't update it optimistically
    },

    onSuccess: (serverRow, _variables, context) => {
      // If we don't have context, invalidate everything
      if (!context?.previousData || !context?.rowId) {
        void utils.row.getRowsInfinite.invalidate({ tableId });
        void utils.row.getRowCount.invalidate({ tableId });
        return;
      }

      // Replace optimistic row with real server data
      utils.row.getRowsInfinite.setInfiniteData(queryKey, (old) => {
        if (!old?.pages?.[0]) return old;

        const firstPage = old.pages[0];
        const rowIndex = firstPage.items.findIndex(
          (item) => item.id === context.rowId,
        );

        // If we can't find the optimistic row, invalidate as fallback
        if (rowIndex === -1) {
          void utils.row.getRowsInfinite.invalidate({ tableId });
          return old;
        }

        // Replace optimistic row with server row (add empty cells array)
        const newRow = { ...serverRow, cells: [] };
        const newItems = [...firstPage.items];
        newItems[rowIndex] = newRow;

        return {
          ...old,
          pages: [{ ...firstPage, items: newItems }, ...old.pages.slice(1)],
        };
      });

      // Update count based on actual data to keep it in sync
      const updatedData = utils.row.getRowsInfinite.getInfiniteData(queryKey);
      const actualRowCount =
        updatedData?.pages.reduce((sum, page) => sum + page.items.length, 0) ??
        0;
      utils.row.getRowCount.setData({ tableId }, actualRowCount);

      // Count was already updated above, no need to update again
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
    >
      <AiOutlinePlus size={16} className="text-gray-600" />
    </button>
  );
}

export default memo(AddRowButton);
