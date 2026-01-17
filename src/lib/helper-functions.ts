import type { ColumnType } from "@/types";
import type { FilterState, SortRule } from "@/types/view";
import type {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";

// transform the sorting state of TANSTACK to our BE expected state so we can apply sorting easier
export function translateSortingState(
  sorting: SortingState,
  columns: ColumnType[],
): SortRule[] {
  return sorting.map<SortRule>((sortItem) => {
    const column = columns.find((c) => c.id === sortItem.id);

    const direction: "asc" | "desc" = sortItem.desc ? "desc" : "asc";

    const type = column?.type === "number" ? "number" : "string";

    return {
      columnId: sortItem.id,
      direction,
      type,
    };
  });
}

// // transform the filtering state of TANSTACK to our BE expected state so we can apply filters easier

export function translateFiltersState(
  columnFilters: ColumnFiltersState,
  columns: ColumnType[],
): FilterState[] {
  return columnFilters
    .map((filter) => {
      const column = columns.find((c) => c.id === filter.id);
      if (!column) return null;

      const type = column.type === "number" ? "number" : "string";

      const { operator, value } = filter.value as {
        operator: string;
        value?: string | number | null;
      };

      return {
        columnId: filter.id,
        operator,
        value,
        type,
      };
    })
    .filter(Boolean) as FilterState[];
}

// trnsform BE view data to table readable data
export function applyViewToTableState(
  activeView:
    | {
        sorting?: SortRule[] | null;
        filters?: FilterState[] | null;
        hidden?: string[] | null;
      }
    | null
    | undefined,
  callbacks: {
    onSortingChange: (
      updater: SortingState | ((prev: SortingState) => SortingState),
    ) => void;
    onColumnFiltersChange: (
      updater:
        | ColumnFiltersState
        | ((prev: ColumnFiltersState) => ColumnFiltersState),
    ) => void;
    onColumnVisibilityChange: (
      updater: VisibilityState | ((prev: VisibilityState) => VisibilityState),
    ) => void;
  },
): void {
  if (!activeView) {
    callbacks.onSortingChange([]);
    callbacks.onColumnFiltersChange([]);
    callbacks.onColumnVisibilityChange({});
    return;
  }

  // Sorting
  const sortingState: SortingState =
    activeView.sorting?.map((sort) => ({
      id: sort.columnId,
      desc: sort.direction === "desc",
    })) ?? [];

  callbacks.onSortingChange(sortingState);

  // Filters
  const filtersState: ColumnFiltersState =
    activeView.filters?.map((filter) => ({
      id: filter.columnId,
      value: {
        operator: filter.operator,
        value: filter.value as unknown,
      },
    })) ?? [];

  callbacks.onColumnFiltersChange(filtersState);

  const visibilityState: VisibilityState = {};

  for (const colId of activeView.hidden ?? []) {
    visibilityState[colId] = false;
  }

  callbacks.onColumnVisibilityChange(visibilityState);
}
