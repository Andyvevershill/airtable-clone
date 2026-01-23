import type { FilterRule } from "@/components/forms/filter-fields-form";
import type { ColumnType, TransformedRow } from "@/types";
import type { FilterState, SortRule } from "@/types/view";
import type {
  Column,
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
  view:
    | {
        sorting?: SortRule[] | null;
        filters?: FilterState[] | null;
        hidden?: string[] | null;
      }
    | null
    | undefined,
  {
    onSortingChange,
    onColumnFiltersChange,
    onColumnVisibilityChange,
  }: {
    onSortingChange: (state: SortingState) => void;
    onColumnFiltersChange: (state: ColumnFiltersState) => void;
    onColumnVisibilityChange: (state: VisibilityState) => void;
  },
): void {
  onSortingChange(
    view?.sorting?.map((s) => ({
      id: s.columnId,
      desc: s.direction === "desc",
    })) ?? [],
  );
  onColumnFiltersChange(
    view?.filters?.map((f) => ({
      id: f.columnId,
      value: { operator: f.operator, value: f.value },
    })) ?? [],
  );
  onColumnVisibilityChange(
    view?.hidden?.reduce((acc, id) => ({ ...acc, [id]: false }), {}) ?? {},
  );
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
