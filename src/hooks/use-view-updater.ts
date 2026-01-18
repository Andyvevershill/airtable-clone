import {
  translateFiltersState,
  translateSortingState,
} from "@/lib/helper-functions";
import { api } from "@/trpc/react";
import type { ColumnType } from "@/types/column";
import type {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { useEffect } from "react";

interface ViewState {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
}

export function useViewUpdater(
  viewId: string,
  tableId: string,
  state: ViewState,
  columns: ColumnType[],
) {
  const utils = api.useUtils();

  const updateView = api.view.updateView.useMutation({
    onSuccess: () => {
      void utils.table.getTableWithViews.invalidate({ tableId });
    },
  });

  useEffect(() => {
    updateView.mutate({
      id: viewId,
      sorting: translateSortingState(state.sorting, columns),
      filters: translateFiltersState(state.columnFilters, columns),
      hidden: Object.keys(state.columnVisibility).filter(
        (columnId) => state.columnVisibility[columnId] === false,
      ),
    });
  }, [
    state.sorting,
    state.columnFilters,
    state.columnVisibility,
    viewId,
    tableId,
    columns,
  ]);
}
