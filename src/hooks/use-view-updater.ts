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
import { useEffect, useRef } from "react";

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

  // Use refs to track previous values and avoid infinite loops
  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  const previousStateRef = useRef<string>("");

  const updateView = api.view.updateView.useMutation({
    // REMOVED: onSuccess invalidation - this was causing the loop!
    // The view update doesn't need to refetch the entire table
  });

  useEffect(() => {
    // Serialize state to detect actual changes
    const currentState = JSON.stringify({
      sorting: state.sorting,
      filters: state.columnFilters,
      visibility: state.columnVisibility,
    });

    // Only update if state actually changed
    if (currentState === previousStateRef.current) {
      return;
    }

    previousStateRef.current = currentState;

    // Debounce: Don't update on every single keystroke/change
    const timeoutId = setTimeout(() => {
      updateView.mutate({
        id: viewId,
        sorting: translateSortingState(state.sorting, columnsRef.current),
        filters: translateFiltersState(state.columnFilters, columnsRef.current),
        hidden: Object.keys(state.columnVisibility).filter(
          (columnId) => state.columnVisibility[columnId] === false,
        ),
      });
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [
    state.sorting,
    state.columnFilters,
    state.columnVisibility,
    viewId,
    updateView,
  ]);
}
