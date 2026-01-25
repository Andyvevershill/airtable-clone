"use client";

import { useLoadingStore } from "@/app/stores/use-loading-store";
import { useGlobalSearchStore } from "@/app/stores/use-search-store";
import { useViewStore } from "@/app/stores/use-view-store";
import NoDataPage from "@/components/no-data-page";
import {
  applyViewToTableState,
  translateFiltersState,
  translateSortingState,
} from "@/lib/helper-functions";
import { api } from "@/trpc/react";
import type { QueryParams } from "@/types/view";
import type {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { useParams } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    if (!tableWithViews?.views) return;
    if (activeView !== null) return;

    const serverActiveView = tableWithViews.views.find((v) => v.isActive);
    if (serverActiveView) {
      setActiveView(serverActiveView);
    }
  }, [tableWithViews?.views]);

  useEffect(() => {
    if (!activeView) return;

    startTransition(() => {
      applyViewToTableState(
        activeView,
        setSorting,
        setFilters,
        setColumnVisibility,
      );
    });

    setIsLoadingView(false);
  }, [activeView?.id, setIsLoadingView]);

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
      limit: 250,
      sorting: translatedSorting,
      filters: translatedFilters,
      globalSearch,
    };
  }, [tableId, sorting, filters, stableColumns, globalSearch]);

  const {
    data: rowsData,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading: rowsLoading,
  } = api.row.getRowsInfinite.useInfiniteQuery(queryParams, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    placeholderData: (prev) => prev,
    enabled: !!activeView && !!stableColumns,
    refetchOnWindowFocus: false,
  });

  const isLoading =
    tableWithViewsLoading || columnsLoading || countLoading || rowsLoading;

  useEffect(() => {
    setIsLoading(isFetching || isLoading);
  }, [isFetching, isLoading, setIsLoading]);

  const rowsWithCells = useMemo(() => {
    return rowsData?.pages.flatMap((p) => p.items) ?? [];
  }, [rowsData]);

  useEffect(() => {
    const isActivelyFiltering =
      (filters.length > 0 || sorting.length > 0) &&
      isFetching &&
      !isFetchingNextPage;

    setIsFiltering(isActivelyFiltering);
  }, [
    filters.length,
    sorting.length,
    isFetching,
    isFetchingNextPage,
    setIsFiltering,
  ]);

  const globalSearchMatches = useMemo(() => {
    return rowsData?.pages.flatMap((p) => p.searchMatches) ?? [];
  }, [rowsData]);

  useEffect(() => {
    if (globalSearch && !isFetching) {
      setGlobalSearchLength(globalSearchMatches.length);
      setIsSearching(false);
    }
  }, [
    globalSearch,
    isFetching,
    globalSearchMatches.length,
    setGlobalSearchLength,
    setIsSearching,
  ]);

  if (isLoading) return null;

  if (!tableWithViews || !stableColumns || !rowsWithCells || !user) {
    return <NoDataPage missingData="table data" />;
  }

  return (
    <TableContainer
      tableWithViews={tableWithViews}
      queryParams={queryParams}
      user={user}
      columns={stableColumns}
      totalFilteredCount={rowsData?.pages[0]?.totalFilteredCount ?? 0}
      rowCount={rowCount ?? 0}
      rowsWithCells={rowsWithCells}
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
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
