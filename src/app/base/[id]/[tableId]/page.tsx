"use client";

import { useLoadingStore } from "@/app/stores/use-loading-store";
import { useGlobalSearchStore } from "@/app/stores/use-search-store";
import NoDataPage from "@/components/no-data-page";
import {
  translateFiltersState,
  translateSortingState,
} from "@/lib/helper-functions";
import { api } from "@/trpc/react";
import type { SearchMatch } from "@/types/view";
import { keepPreviousData } from "@tanstack/react-query";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import TableContainer from "./table-container";

export default function TablePage() {
  const { tableId } = useParams<{ tableId: string }>();
  const { setIsLoading, setIsFiltering } = useLoadingStore();
  const { setGlobalSearchLength, setIsSearching } = useGlobalSearchStore();
  const { globalSearch } = useGlobalSearchStore();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filters, setFilters] = useState<ColumnFiltersState>([]);

  const { data: tableWithViews, isLoading: tableWithViewsLoading } =
    api.table.getTableWithViews.useQuery({ tableId });

  const { data: columns, isLoading: columnsLoading } =
    api.column.getColumns.useQuery({ tableId });

  const { data: rowCount, isLoading: countLoading } =
    api.row.getRowCount.useQuery({ tableId });

  const {
    data: rowsData,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading: rowsLoading,
  } = api.row.getRowsInfinite.useInfiniteQuery(
    {
      tableId,
      limit: 5000,
      sorting: translateSortingState(sorting, columns ?? []),
      filters: translateFiltersState(filters, columns ?? []),
      globalSearch,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      placeholderData: keepPreviousData,
    },
  );

  const isLoading =
    tableWithViewsLoading ||
    columnsLoading ||
    countLoading ||
    rowsLoading ||
    rowCount === 0;

  useEffect(() => {
    setIsLoading(isFetching || isLoading);
  }, [isLoading, setIsLoading, isFetching]);

  // combine rows from all pages
  const rowsWithCells = useMemo(
    () => rowsData?.pages?.flatMap((page) => page.items) ?? [],
    [rowsData],
  );

  // Track when filtering starts and stops
  useEffect(() => {
    if (filters.length > 0 && isFetching) {
      // Filtering has started
      setIsFiltering(true);
    } else if (!isFetching) {
      // Filtering has finished (we have results or no results)
      setIsFiltering(false);
    }
  }, [filters.length, isFetching, setIsFiltering]);

  // transform search matches into readable format
  const globalSearchMatches = useMemo(() => {
    if (!rowsData?.pages) {
      return { matches: [] as SearchMatch[] };
    }

    const matches = rowsData.pages.flatMap(
      (page) => page.searchMatches.matches,
    );

    return {
      matches,
    };
  }, [rowsData?.pages]);

  useEffect(() => {
    setGlobalSearchLength(globalSearchMatches.matches.length);
    setIsSearching(false);
  }, [
    globalSearchMatches.matches.length,
    setGlobalSearchLength,
    setIsSearching,
  ]);

  if (isLoading) {
    return null;
  }

  if (!tableWithViews || !columns || !rowsData) {
    return <NoDataPage missingData="table data" />;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <TableContainer
        tableWithViews={tableWithViews}
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
    </div>
  );
}
