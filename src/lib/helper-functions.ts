import type { FilterRule } from "@/components/forms/filter-fields-form";
import type { ColumnType, TransformedRow } from "@/types";
import type { FilterState, SortRule } from "@/types/view";
import type {
  Column,
  ColumnFiltersState,
  OnChangeFn,
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

export function applyViewToTableState(
  activeView:
    | {
        sorting?: SortRule[] | null;
        filters?: FilterState[] | null;
        hidden?: string[] | null;
      }
    | null
    | undefined,
  onSortingChange: OnChangeFn<SortingState>,
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>,
  onColumnVisibilityChange: OnChangeFn<VisibilityState>,
): void {
  // first lets handle the case where there is no active view
  // this means setting all the states to empty
  if (!activeView) {
    onSortingChange([]);
    onColumnFiltersChange([]);
    onColumnVisibilityChange({});
    return;
  }

  // Apply sorting
  const sortingState: SortingState =
    activeView.sorting?.map((sort) => ({
      id: sort.columnId,
      desc: sort.direction === "desc",
    })) ?? [];

  onSortingChange(sortingState);

  // Apply filters
  const filtersState: ColumnFiltersState =
    activeView.filters?.map((filter) => ({
      id: filter.columnId,
      value: {
        operator: filter.operator,
        value: filter.value as unknown,
      },
    })) ?? [];

  onColumnFiltersChange(filtersState);

  // Apply visibility
  const visibilityState: VisibilityState = {};

  for (const colId of activeView.hidden ?? []) {
    visibilityState[colId] = false;
  }

  onColumnVisibilityChange(visibilityState);
}

// transforms the sorts inside the form so we can send them to update the views
export function transformSortingToView(
  newSorting: SortingState,
  columns: Column<TransformedRow, unknown>[],
): SortRule[] {
  return newSorting.map((sort) => ({
    columnId: sort.id,
    direction: sort.desc ? ("desc" as const) : ("asc" as const),
    type:
      columns?.find((c) => c.id === sort.id)?.columnDef.meta?.dataType ===
      "string"
        ? ("string" as const)
        : ("number" as const),
  }));
}

// transforms the filters inside the form so we can send them to update the views

export function transformFiltersToView(
  filters: FilterRule[],
  columns: Column<TransformedRow, unknown>[],
) {
  return filters
    .filter((f) => f.fieldId && f.operator)
    .map((f) => {
      const columnType = columns.find((c) => c.id === f.fieldId)?.columnDef.meta
        ?.dataType;

      return {
        columnId: f.fieldId!,
        operator: f.operator! as
          | "greaterThan"
          | "lessThan"
          | "contains"
          | "notContains"
          | "equals"
          | "isEmpty"
          | "isNotEmpty",
        value: f.value,
        type:
          columnType === "string" ? ("string" as const) : ("number" as const),
      };
    });
}
