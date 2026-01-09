"use client";

import { TableSidebar } from "@/components/base-by-id/navigation/table-sidebar";
import NoDataPage from "@/components/no-data-page";
import { TableContainer } from "@/components/table/table-container";
import { TableToolbar } from "@/components/table/table-toolbar";
import { api } from "@/trpc/react";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function TablePage() {
  const { tableId } = useParams<{ tableId: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: tableData, isLoading } = api.table.getById.useQuery({
    tableId,
  });

  if (isLoading) return null;
  if (!tableData) return <NoDataPage missingData="tables" />;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <TableToolbar sideBarState={[sidebarOpen, setSidebarOpen]} />

      <div className="flex flex-1 overflow-hidden">
        <TableSidebar sidebarOpen={sidebarOpen} />

        <div className="flex-1 overflow-auto">
          <TableContainer tableData={tableData} />
        </div>
      </div>
    </div>
  );
}
