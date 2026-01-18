import {
  translateFiltersState,
  translateSortingState,
} from "@/lib/helper-functions";
import { api } from "@/trpc/react";
import type { ColumnType } from "@/types/column";
import type { ViewInput } from "@/types/view";
import type {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import isEqual from "fast-deep-equal";
import { useEffect, useMemo, useRef } from "react";

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
    onError: (err) => {
      console.error(
        "%c[view:update] ERROR",
        "color:#dc2626;font-weight:bold",
        err,
      );
    },
  });

  const nextViewInput: ViewInput = useMemo(() => {
    const payload = {
      id: viewId,
      sorting: translateSortingState(state.sorting, columns),
      filters: translateFiltersState(state.columnFilters, columns),
      hidden: Object.keys(state.columnVisibility).filter(
        (columnId) => state.columnVisibility[columnId] === false,
      ),
    };

    return payload;
  }, [
    viewId,
    state.sorting,
    state.columnFilters,
    state.columnVisibility,
    columns,
  ]);

  const lastCommittedRef = useRef<ViewInput | null>(null);
  const lastViewIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!viewId) {
      return;
    }

    if (lastViewIdRef.current !== viewId) {
      lastViewIdRef.current = viewId;
      lastCommittedRef.current = nextViewInput;
      return;
    }

    if (!lastCommittedRef.current) {
      lastCommittedRef.current = nextViewInput;
      return;
    }

    if (isEqual(lastCommittedRef.current, nextViewInput)) {
      return;
    }

    lastCommittedRef.current = nextViewInput;
    updateView.mutate(nextViewInput);
  }, [nextViewInput, viewId, updateView]);
}
