import { PAGE_SIZE } from "@/lib/constants";
import {
  translateFiltersState,
  translateSortingState,
  viewToFiltersState,
  viewToSortingState,
} from "@/lib/helper-functions";
import { api, HydrateClient } from "@/trpc/server";
import { notFound } from "next/navigation";
import TablePage from "./table/table-page";

export default async function Page({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = await params;

  // need the active view + columns here so the rows we prefetch are exactly
  // what the client asks for (same sorts/filters) - otherwise it's a wasted query
  const [tableWithViews, columns] = await Promise.all([
    api.table.getTableWithViews({ tableId }).catch(() => null),
    api.column.getColumns({ tableId }).catch(() => null),
    api.table.getTableWithViews.prefetch({ tableId }),
    api.column.getColumns.prefetch({ tableId }),
    api.row.getRowCount.prefetch({ tableId }),
  ]);

  if (!tableWithViews || !columns) notFound();

  const activeView =
    tableWithViews.views.find((v) => v.isActive) ?? tableWithViews.views[0];

  if (activeView) {
    await api.row.getRows.prefetch({
      tableId,
      limit: PAGE_SIZE,
      sorting: translateSortingState(viewToSortingState(activeView), columns),
      filters: translateFiltersState(viewToFiltersState(activeView), columns),
      page: 0,
    });
  }

  return (
    <HydrateClient>
      <TablePage />
    </HydrateClient>
  );
}
