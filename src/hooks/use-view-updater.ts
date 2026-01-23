import { useViewStore } from "@/app/stores/use-view-store";
import { api } from "@/trpc/react";
import type { FilterState, SortRule } from "@/types/view";

export function useViewUpdater() {
  const { activeView, setActiveView, setSavingView } = useViewStore();
  const utils = api.useUtils();

  const updateSorting = api.view.updateViewSorting.useMutation({
    onMutate: async ({ sorting }) => {
      if (!activeView) return;

      console.log(
        "🔵 [useViewUpdater] onMutate - Updating sorting for view:",
        activeView.name,
      );
      console.log("  Current sorting in activeView:", activeView.sorting);
      console.log("  New sorting to save:", sorting);
      setSavingView(true);

      await utils.table.getTableWithViews.cancel({
        tableId: activeView.tableId,
      });

      const previousData = utils.table.getTableWithViews.getData({
        tableId: activeView.tableId,
      });

      console.log(
        "  Previous cache data:",
        previousData?.views.find((v) => v.id === activeView.id)?.sorting,
      );

      const updatedView = {
        ...activeView,
        sorting: sorting ?? null,
      };
      setActiveView(updatedView);
      console.log("  ✅ Store updated with new sorting");

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
      console.log("  ✅ React Query cache updated");

      return { previousData, previousSorting: activeView.sorting };
    },
    onSuccess: () => {
      console.log("✅ [useViewUpdater] Sorting saved to server successfully");
      setSavingView(false);
    },
    onError: (_err, _variables, context) => {
      if (!activeView) return;

      console.error("❌ [useViewUpdater] Failed to save sorting, rolling back");
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

      console.log(
        "🔵 [useViewUpdater] onMutate - Updating filters for view:",
        activeView.name,
      );
      console.log("  Current filters in activeView:", activeView.filters);
      console.log("  New filters to save:", filters);
      setSavingView(true);

      await utils.table.getTableWithViews.cancel({
        tableId: activeView.tableId,
      });

      const previousData = utils.table.getTableWithViews.getData({
        tableId: activeView.tableId,
      });

      console.log(
        "  Previous cache data:",
        previousData?.views.find((v) => v.id === activeView.id)?.filters,
      );

      const updatedView = {
        ...activeView,
        filters: filters ?? null,
      };
      setActiveView(updatedView);
      console.log("  ✅ Store updated with new filters");

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
      console.log("  ✅ React Query cache updated");

      return { previousData, previousFilters: activeView.filters };
    },
    onSuccess: () => {
      console.log("✅ [useViewUpdater] Filters saved to server successfully");
      setSavingView(false);
    },
    onError: (_err, _variables, context) => {
      if (!activeView) return;

      console.error("❌ [useViewUpdater] Failed to save filters, rolling back");
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

      console.log(
        "🔵 [useViewUpdater] onMutate - Updating hidden columns for view:",
        activeView.name,
      );
      console.log("  Current hidden in activeView:", activeView.hidden);
      console.log("  New hidden to save:", hidden);
      setSavingView(true);

      await utils.table.getTableWithViews.cancel({
        tableId: activeView.tableId,
      });

      const previousData = utils.table.getTableWithViews.getData({
        tableId: activeView.tableId,
      });

      console.log(
        "  Previous cache data:",
        previousData?.views.find((v) => v.id === activeView.id)?.hidden,
      );

      const updatedView = {
        ...activeView,
        hidden: hidden ?? null,
      };
      setActiveView(updatedView);
      console.log("  ✅ Store updated with new hidden columns");

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
      console.log("  ✅ React Query cache updated");

      return { previousData, previousHidden: activeView.hidden };
    },
    onSuccess: () => {
      console.log(
        "✅ [useViewUpdater] Hidden columns saved to server successfully",
      );
      setSavingView(false);
    },
    onError: (_err, _variables, context) => {
      if (!activeView) return;

      console.error(
        "❌ [useViewUpdater] Failed to save hidden columns, rolling back",
      );
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

    console.log("🟡 [useViewUpdater] updateViewSorting called with:", sorting);
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

    console.log("🟡 [useViewUpdater] updateViewHidden called with:", hidden);
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
