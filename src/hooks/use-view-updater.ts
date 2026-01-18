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
    onMutate: (input) => {
      console.log(
        "%c[view:update] MUTATE",
        "color:#2563eb;font-weight:bold",
        input,
      );
    },
    onSuccess: () => {
      console.log(
        "%c[view:update] SUCCESS – invalidating table",
        "color:#16a34a;font-weight:bold",
        { tableId },
      );
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

  /**
   * 1️⃣ Build the derived view payload (memoized)
   */
  const nextViewInput: ViewInput = useMemo(() => {
    const payload = {
      id: viewId,
      sorting: translateSortingState(state.sorting, columns),
      filters: translateFiltersState(state.columnFilters, columns),
      hidden: Object.keys(state.columnVisibility).filter(
        (columnId) => state.columnVisibility[columnId] === false,
      ),
    };

    console.log(
      "%c[view:update] BUILD PAYLOAD",
      "color:#7c3aed;font-weight:bold",
      payload,
    );

    return payload;
  }, [
    viewId,
    state.sorting,
    state.columnFilters,
    state.columnVisibility,
    columns,
  ]);

  /**
   * 2️⃣ Track last committed payload PER VIEW
   */
  const lastCommittedRef = useRef<ViewInput | null>(null);
  const lastViewIdRef = useRef<string | null>(null);

  /**
   * 3️⃣ Decide whether to save
   */
  useEffect(() => {
    if (!viewId) {
      console.log("%c[view:update] SKIP – no viewId", "color:#9ca3af");
      return;
    }

    // 🔥 RESET if view changed
    if (lastViewIdRef.current !== viewId) {
      console.log(
        "%c[view:update] VIEW CHANGED – resetting baseline",
        "color:#f59e0b;font-weight:bold",
        {
          from: lastViewIdRef.current,
          to: viewId,
        },
      );
      lastViewIdRef.current = viewId;
      lastCommittedRef.current = nextViewInput;
      return;
    }

    if (!lastCommittedRef.current) {
      console.log(
        "%c[view:update] INIT – setting baseline, not saving",
        "color:#9ca3af",
      );
      lastCommittedRef.current = nextViewInput;
      return;
    }

    if (isEqual(lastCommittedRef.current, nextViewInput)) {
      console.log(
        "%c[view:update] SKIP – no meaningful change",
        "color:#9ca3af",
      );
      return;
    }

    console.log(
      "%c[view:update] CHANGE DETECTED – saving view",
      "color:#f59e0b;font-weight:bold",
      {
        previous: lastCommittedRef.current,
        next: nextViewInput,
      },
    );

    lastCommittedRef.current = nextViewInput;
    updateView.mutate(nextViewInput);
  }, [nextViewInput, viewId, updateView]);
}
