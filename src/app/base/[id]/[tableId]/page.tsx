"use client";

import { useLoadingStore } from "@/app/stores/use-loading-store";
import { useGlobalSearchStore } from "@/app/stores/use-search-store";
import NoDataPage from "@/components/no-data-page";
import {
  translateFiltersState,
  translateSortingState,
} from "@/lib/helper-functions";
import { api } from "@/trpc/react";
import { keepPreviousData } from "@tanstack/react-query";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import TableContainer from "./table-container";

export default function TablePage() {
  const { tableId } = useParams<{ tableId: string }>();
  const { setIsLoading, setIsFiltering } = useLoadingStore();
  const { globalSearch, setGlobalSearchLength, setIsSearching } =
    useGlobalSearchStore();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [filters, setFilters] = useState<ColumnFiltersState>([]);

  const { data: user } = api.user.getUser.useQuery();

  const { data: tableWithViews, isLoading: tableWithViewsLoading } =
    api.table.getTableWithViews.useQuery({ tableId });

  const { data: columns, isLoading: columnsLoading } =
    api.column.getColumns.useQuery({ tableId });

  const { data: rowCount, isLoading: countLoading } =
    api.row.getRowCount.useQuery({ tableId });

  const queryParams = useMemo(
    () => ({
      tableId,
      limit: 3000,
      sorting: translateSortingState(sorting, columns ?? []),
      filters: translateFiltersState(filters, columns ?? []),
      globalSearch,
    }),
    [tableId, sorting, filters, columns, globalSearch],
  );

  const {
    data: rowsData,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading: rowsLoading,
  } = api.row.getRowsInfinite.useInfiniteQuery(queryParams, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    placeholderData: keepPreviousData,
  });

  const isLoading =
    tableWithViewsLoading ||
    columnsLoading ||
    countLoading ||
    rowsLoading ||
    rowCount === 0;

  useEffect(() => {
    setIsLoading(isFetching || isLoading);
  }, [isFetching, isLoading, setIsLoading]);

  const rowsWithCells = useMemo(
    () => rowsData?.pages.flatMap((p) => p.items) ?? [],
    [rowsData],
  );

  useEffect(() => {
    if (filters.length && isFetching) setIsFiltering(true);
    if (!isFetching) setIsFiltering(false);
  }, [filters.length, isFetching, setIsFiltering]);

  const globalSearchMatches = useMemo(
    () => ({
      matches: rowsData?.pages.flatMap((p) => p.searchMatches.matches) ?? [],
    }),
    [rowsData],
  );

  // Stop spinner when search completes (fetching stops AND we have search query)
  useEffect(() => {
    if (globalSearch && !isFetching) {
      setGlobalSearchLength(globalSearchMatches.matches.length);
      setIsSearching(false);
    }
  }, [
    globalSearch,
    isFetching,
    globalSearchMatches.matches.length,
    setGlobalSearchLength,
    setIsSearching,
  ]);

  if (isLoading) return null;

  if (!tableWithViews || !columns || !rowsData || !user) {
    return <NoDataPage missingData="table data" />;
  }

  return (
    <TableContainer
      tableWithViews={tableWithViews}
      user={user}
      columns={columns}
      rowCount={rowCount ?? 0}
      rowsWithCells={rowsWithCells}
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      sorting={sorting}
      onSortingChange={setSorting}
      columnFilters={filters}
      onColumnFiltersChange={setFilters}
      globalSearchMatches={globalSearchMatches}
    />
  );
}
