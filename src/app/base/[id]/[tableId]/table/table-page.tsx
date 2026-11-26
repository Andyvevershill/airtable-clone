"use client";

import { useRowPages } from "@/hooks/use-row-pages";
import { PAGE_SIZE } from "@/lib/constants";
import {
  applyViewToTableState,
  translateFiltersState,
  translateSortingState,
} from "@/lib/helper-functions";
import { useLoadingStore } from "@/stores/use-loading-store";
import { useGlobalSearchStore } from "@/stores/use-search-store";
import { useViewStore } from "@/stores/use-view-store";
import { api } from "@/trpc/react";
import type { QueryParams } from "@/types/view";
import type {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import TableContainer from "./table-container";

export default function TablePage() {
  const { tableId } = useParams<{ tableId: string }>();
  const { setIsLoading, setIsFiltering, setIsLoadingView } = useLoadingStore();
  const { globalSearch, setGlobalSearchLength, setIsSearching } =
    useGlobalSearchStore();
  const { activeView, setActiveView } = useViewStore();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [filters, setFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  // which view the sorting/filters above came from
  const [appliedViewId, setAppliedViewId] = useState<string | null>(null);

  const { data: user } = api.user.getUser.useQuery(undefined, {
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const { data: tableWithViews, isLoading: tableWithViewsLoading } =
    api.table.getTableWithViews.useQuery(
      { tableId },
      {
        staleTime: 10 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchInterval: 10 * 60 * 1000,
        refetchIntervalInBackground: false,
      },
    );

  const { data: columns, isLoading: columnsLoading } =
    api.column.getColumns.useQuery(
      { tableId },
      {
        staleTime: Infinity,
        gcTime: 10 * 60 * 1000,
      },
    );

  const { data: rowCount, isLoading: countLoading } =
    api.row.getRowCount.useQuery(
      { tableId },
      {
        staleTime: Infinity,
        gcTime: 10 * 60 * 1000,
      },
    );

  const stableColumns = useMemo(() => columns, [columns]);

  // the view store is global, so it can still be holding a view from the last table we were on
  const viewIsForThisTable = activeView?.tableId === tableId;

  useEffect(() => {
    if (!tableWithViews?.views) return;
    if (viewIsForThisTable) return;

    // a bug when we delete the last view so none is active - fallback to assign a view
    const serverActiveView =
      tableWithViews.views.find((v) => v.isActive) ?? tableWithViews.views[0];
    if (serverActiveView) {
      setActiveView(serverActiveView);
    }
  }, [tableWithViews?.views, viewIsForThisTable]);

  useEffect(() => {
    if (!activeView || !viewIsForThisTable) return;

    applyViewToTableState(
      activeView,
      setSorting,
      setFilters,
      setColumnVisibility,
    );
    setAppliedViewId(activeView.id);

    setIsLoadingView(false);
  }, [activeView?.id, viewIsForThisTable, setIsLoadingView]);

  // don't fetch rows until the view's sorts/filters are in state, otherwise we fetch unsorted rows first for nothing
  const viewReady = viewIsForThisTable && appliedViewId === activeView?.id;

  const queryParams: QueryParams = useMemo(() => {
    const translatedSorting = translateSortingState(
      sorting,
      stableColumns ?? [],
    );
    const translatedFilters = translateFiltersState(
      filters,
      stableColumns ?? [],
    );

    return {
      tableId,
      limit: PAGE_SIZE,
      sorting: translatedSorting,
      filters: translatedFilters,
    };
  }, [tableId, sorting, filters, stableColumns]);

  const {
    rows: transformedRows,
    totalFilteredCount,
    loadRows,
    isLoading: rowsLoading,
    isFetching,
    isFetchingFirstPage,
    isFetchingMore,
  } = useRowPages(queryParams, viewReady && !!stableColumns);

  const isLoading =
    tableWithViewsLoading ||
    columnsLoading ||
    countLoading ||
    (viewReady && rowsLoading);

  useEffect(() => {
    setIsLoading(isFetching || isLoading);
  }, [isFetching, isLoading, setIsLoading]);

  useEffect(() => {
    const isActivelyFiltering =
      (filters.length > 0 || sorting.length > 0) && isFetchingFirstPage;

    setIsFiltering(isActivelyFiltering);
  }, [filters.length, sorting.length, isFetchingFirstPage, setIsFiltering]);

  // search runs on its own so typing a search doesn't throw away the loaded rows
  const { data: searchMatches, isFetching: isSearchFetching } =
    api.row.searchMatches.useQuery(
      {
        tableId,
        sorting: queryParams.sorting,
        filters: queryParams.filters,
        search: globalSearch,
      },
      {
        enabled: !!globalSearch.trim() && viewReady && !!stableColumns,
        refetchOnWindowFocus: false,
      },
    );

  const globalSearchMatches = useMemo(
    () => searchMatches ?? [],
    [searchMatches],
  );

  useEffect(() => {
    if (globalSearch && !isSearchFetching) {
      setGlobalSearchLength(globalSearchMatches.length);
      setIsSearching(false);
    }
  }, [
    globalSearch,
    isSearchFetching,
    globalSearchMatches.length,
    setGlobalSearchLength,
    setIsSearching,
  ]);

  // Keep the loading check
  if (isLoading) return null;

  if (!tableWithViews || !stableColumns || !user) {
    return null;
  }

  return (
    <TableContainer
      tableWithViews={tableWithViews}
      queryParams={queryParams}
      user={user}
      columns={stableColumns}
      totalFilteredCount={totalFilteredCount ?? 0}
      rowCount={rowCount ?? 0}
      transformedRows={transformedRows}
      loadRows={loadRows}
      isFetchingMore={isFetchingMore}
      sorting={sorting}
      onSortingChange={setSorting}
      columnFilters={filters}
      onColumnFiltersChange={setFilters}
      columnVisibility={columnVisibility}
      onColumnVisibilityChange={setColumnVisibility}
      globalSearchMatches={globalSearchMatches}
    />
  );
}
