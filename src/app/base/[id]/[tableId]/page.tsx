import { api, HydrateClient } from "@/trpc/server";
import TablePage from "./table/table-page";

export default async function Page({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = await params;

  // Prefetch all data on server for instant load

  await Promise.all([
    api.table.getTableWithViews.prefetch({ tableId }),
    api.column.getColumns.prefetch({ tableId }),
    api.row.getRowCount.prefetch({ tableId }),
    // For infinite queries, just prefetch the first page
    api.row.getRowsInfinite.prefetch({
      tableId,
      limit: 250,
      sorting: [],
      filters: [],
      globalSearch: "",
    }),
  ]);

  return (
    <HydrateClient>
      <TablePage />
    </HydrateClient>
  );
}
