import { useViewStore } from "@/app/stores/use-view-store";
import { api } from "@/trpc/react";
import type { FilterState, SortRule } from "@/types/view";
import type { VisibilityState } from "@tanstack/react-table";

export function useViewUpdater() {
  const { activeViewId, setSavingView } = useViewStore();

  const updateSorting = api.view.updateViewSorting.useMutation({
    // onMutate: () => {
    //   setSavingView(true);
    // },
    // onSuccess: () => {
    //   setSavingView(false);
    // },
  });
  const updateFilters = api.view.updateViewFilters.useMutation({
    // onMutate: () => {
    //   setSavingView(true);
    // },
    // onSuccess: () => {
    //   setSavingView(false);
    // },
  });
  const updateHidden = api.view.updateViewHidden.useMutation({
    // onMutate: () => {
    //   setSavingView(true);
    // },
    // onSuccess: () => {
    //   setSavingView(false);
    // },
  });

  const updateViewSorting = (sorting: SortRule[]) => {
    updateSorting.mutate({
      id: activeViewId,
      sorting,
    });
  };

  const updateViewFilters = (filters: FilterState[]) => {
    updateFilters.mutate({
      id: activeViewId,
      filters,
    });
  };

  const updateViewHidden = (
    columnVisibility: VisibilityState,
    activeView: string,
  ) => {
    updateHidden.mutate({
      id: activeView,
      hidden: Object.keys(columnVisibility).filter(
        (columnId) => columnVisibility[columnId] === false,
      ),
    });
  };

  return {
    updateViewSorting,
    updateViewFilters,
    updateViewHidden,
  };
}
