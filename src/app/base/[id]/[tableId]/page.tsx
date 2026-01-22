"use client";

import { useLoadingStore } from "@/app/stores/use-loading-store";
import { useGlobalSearchStore } from "@/app/stores/use-search-store";
import NoDataPage from "@/components/no-data-page";
import {
  translateFiltersState,
  translateSortingState,
} from "@/lib/helper-functions";
import { api } from "@/trpc/react";
import type { QueryParams } from "@/types/view";
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

  // need this for View card data (email + name)
  const { data: user } = api.user.getUser.useQuery();

  // basic data - mostly for the views + table name to display in tab
  const { data: tableWithViews, isLoading: tableWithViewsLoading } =
    api.table.getTableWithViews.useQuery({ tableId });

  const { data: columns, isLoading: columnsLoading } =
    api.column.getColumns.useQuery({ tableId });

  // Memoize columns to prevent reference changes
  const stableColumns = useMemo(
    () => columns,
    [columns?.length, columns?.map((c) => c.id).join(",")],
  );

  const { data: rowCount, isLoading: countLoading } =
    api.row.getRowCount.useQuery({ tableId });

  // this is the key that allows us to get into the getRowsInfinite and optimistically update the data
  // memoised to stop us recalculating every render - as this wad driving me mad
  const queryParams: QueryParams = useMemo(() => {
    const translatedSorting = translateSortingState(
      sorting,
      stableColumns ?? [],
    );
    const translatedFilters = translateFiltersState(
      filters,
      stableColumns ?? [],
    );
    const params = {
      tableId,
      limit: 3000,
      sorting: translatedSorting,
      filters: translatedFilters,
      globalSearch,
    };
    return params;
  }, [tableId, sorting, filters, stableColumns, globalSearch]);

  const {
    data: rowsData,

    // nice functions we can use from infinite query:
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading: rowsLoading,
  } = api.row.getRowsInfinite.useInfiniteQuery(queryParams, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,

    // we could probs remove below now as we display loading spinners immediatley after pressing filter/sort?
    placeholderData: keepPreviousData,
  });

  const isLoading =
    tableWithViewsLoading || columnsLoading || countLoading || rowsLoading;

  useEffect(() => {
    setIsLoading(isFetching || isLoading);
  }, [isFetching, isLoading, setIsLoading]);

  const rowsWithCells = useMemo(() => {
    const rows = rowsData?.pages.flatMap((p) => p.items) ?? [];
    return rows;
  }, [rowsData]);

  useEffect(() => {
    // Only show filtering spinner when actively filtering/sorting (not paginating)
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
    const matches = {
      matches: rowsData?.pages.flatMap((p) => p.searchMatches.matches) ?? [],
    };
    return matches;
  }, [rowsData]);

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

  if (!tableWithViews || !stableColumns || !rowsData || !user) {
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
      globalSearchMatches={globalSearchMatches}
    />
  );
}
