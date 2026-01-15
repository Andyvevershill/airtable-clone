"use client";

import { useLoadingStore } from "@/app/stores/use-loading-store";
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
  const setIsLoading = useLoadingStore((state) => state.setIsLoading);
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
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      placeholderData: keepPreviousData,
    },
  );

  const rowsWithCells = useMemo(
    () => rowsData?.pages?.flatMap((page) => page.items) ?? [],
    [rowsData],
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

  if (isLoading) return null;

  if (!tableWithViews || !columns || !rowsWithCells) {
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
      />
    </div>
  );
}
