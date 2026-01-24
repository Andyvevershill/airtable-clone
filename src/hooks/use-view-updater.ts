import { useViewStore } from "@/app/stores/use-view-store";
import { api } from "@/trpc/react";
import type { FilterState, SortRule } from "@/types/view";

export function useViewUpdater() {
  const { activeView, setActiveView, setSavingView } = useViewStore();
  const utils = api.useUtils();

  const updateSorting = api.view.updateViewSorting.useMutation({
    onMutate: async ({ sorting }) => {
      if (!activeView) return;

      setSavingView(true);

      await utils.table.getTableWithViews.cancel({
        tableId: activeView.tableId,
      });

      const previousData = utils.table.getTableWithViews.getData({
        tableId: activeView.tableId,
      });

      const updatedView = {
        ...activeView,
        sorting: sorting ?? null,
      };
      setActiveView(updatedView);

      utils.table.getTableWithViews.setData(
        { tableId: activeView.tableId },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            views: old.views.map((v) =>
              v.id === activeView.id ? { ...v, sorting: sorting ?? null } : v,
            ),
          };
        },
      );

      return { previousData, previousSorting: activeView.sorting };
    },
    onSuccess: () => {
      setSavingView(false);
    },
    onError: (_err, _variables, context) => {
      if (!activeView) return;

      setSavingView(false);

      if (context?.previousSorting !== undefined) {
        setActiveView({
          ...activeView,
          sorting: context.previousSorting,
        });
      }
      if (context?.previousData) {
        utils.table.getTableWithViews.setData(
          { tableId: activeView.tableId },
          context.previousData,
        );
      }
    },
  });

  const updateFilters = api.view.updateViewFilters.useMutation({
    onMutate: async ({ filters }) => {
      if (!activeView) return;

      setSavingView(true);

      await utils.table.getTableWithViews.cancel({
        tableId: activeView.tableId,
      });

      const previousData = utils.table.getTableWithViews.getData({
        tableId: activeView.tableId,
      });

      const updatedView = {
        ...activeView,
        filters: filters ?? null,
      };
      setActiveView(updatedView);

      utils.table.getTableWithViews.setData(
        { tableId: activeView.tableId },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            views: old.views.map((v) =>
              v.id === activeView.id ? { ...v, filters: filters ?? null } : v,
            ),
          };
        },
      );

      return { previousData, previousFilters: activeView.filters };
    },
    onSuccess: () => {
      setSavingView(false);
    },
    onError: (_err, _variables, context) => {
      if (!activeView) return;

      setSavingView(false);

      if (context?.previousFilters !== undefined) {
        setActiveView({
          ...activeView,
          filters: context.previousFilters,
        });
      }
      if (context?.previousData) {
        utils.table.getTableWithViews.setData(
          { tableId: activeView.tableId },
          context.previousData,
        );
      }
    },
  });

  const updateHidden = api.view.updateViewHidden.useMutation({
    onMutate: async ({ hidden }) => {
      if (!activeView) return;

      setSavingView(true);

      await utils.table.getTableWithViews.cancel({
        tableId: activeView.tableId,
      });

      const previousData = utils.table.getTableWithViews.getData({
        tableId: activeView.tableId,
      });

      const updatedView = {
        ...activeView,
        hidden: hidden ?? null,
      };
      setActiveView(updatedView);

      utils.table.getTableWithViews.setData(
        { tableId: activeView.tableId },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            views: old.views.map((v) =>
              v.id === activeView.id ? { ...v, hidden: hidden ?? null } : v,
            ),
          };
        },
      );

      return { previousData, previousHidden: activeView.hidden };
    },
    onSuccess: () => {
      setSavingView(false);
    },
    onError: (_err, _variables, context) => {
      if (!activeView) return;

      setSavingView(false);

      if (context?.previousHidden !== undefined) {
        setActiveView({
          ...activeView,
          hidden: context.previousHidden,
        });
      }
      if (context?.previousData) {
        utils.table.getTableWithViews.setData(
          { tableId: activeView.tableId },
          context.previousData,
        );
      }
    },
  });

  const updateViewSorting = (sorting: SortRule[]) => {
    if (!activeView) {
      console.warn(
        "⚠️ [useViewUpdater] Cannot update sorting - no active view",
      );
      return;
    }

    updateSorting.mutate({
      id: activeView.id,
      sorting,
    });
  };

  const updateViewFilters = (filters: FilterState[]) => {
    if (!activeView) {
      console.warn(
        "⚠️ [useViewUpdater] Cannot update filters - no active view",
      );
      return;
    }

    updateFilters.mutate({
      id: activeView.id,
      filters,
    });
  };

  const updateViewHidden = (hidden: string[]) => {
    if (!activeView) {
      console.warn("⚠️ [useViewUpdater] Cannot update hidden - no active view");
      return;
    }

    updateHidden.mutate({
      id: activeView.id,
      hidden,
    });
  };

  return {
    updateViewSorting,
    updateViewFilters,
    updateViewHidden,
  };
}
