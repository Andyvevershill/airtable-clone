"use client";

import { useLoadingStore } from "@/app/stores/use-loading-store";
import NoDataPage from "@/components/no-data-page";
import TableContainer from "@/components/table/table-container";
import { api } from "@/trpc/react";
import { useParams } from "next/navigation";
import { useEffect, useMemo } from "react";

export default function TablePage() {
  const { tableId } = useParams<{ tableId: string }>();
  const setIsLoading = useLoadingStore((state) => state.setIsLoading);

  // replace this with just Views, table Id is all we need and its inside col + rows
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
    isFetchingNextPage,
    isLoading: rowsLoading,
  } = api.row.getRowsInfinite.useInfiniteQuery(
    {
      tableId,
      limit: 200,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
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
    setIsLoading(isLoading);
  }, [isLoading, setIsLoading]);

  if (isLoading) return null;

  if (!tableWithViews || !columns || !rowsWithCells) {
    return <NoDataPage missingData="table data" />;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <TableContainer
        tableId={tableWithViews.id}
        columns={columns}
        rowsWithCells={rowsWithCells}
        rowCount={rowCount ?? 0}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
    </div>
  );
}
