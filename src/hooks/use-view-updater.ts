import { useViewStore } from "@/app/stores/use-view-store";
import { api } from "@/trpc/react";
import type { FilterState, SortRule } from "@/types/view";

export function useViewUpdater() {
  const { activeViewId, setSavingView } = useViewStore();

  const updateSorting = api.view.updateViewSorting.useMutation({
    onMutate: () => {
      setSavingView(true);
    },
    onSuccess: () => {
      setSavingView(false);
    },
  });

  const updateFilters = api.view.updateViewFilters.useMutation({
    onMutate: () => {
      setSavingView(true);
    },
    onSuccess: () => {
      setSavingView(false);
    },
  });

  const updateHidden = api.view.updateViewHidden.useMutation({
    onMutate: () => {
      setSavingView(true);
      console.log("updating hidden fields");
    },
    onSuccess: () => {
      setSavingView(false);
      console.log("saved successfully ");
    },
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

  const updateViewHidden = (hidden: string[]) => {
    updateHidden.mutate({
      id: activeViewId,
      hidden,
    });
  };

  return {
    updateViewSorting,
    updateViewFilters,
    updateViewHidden,
  };
}
