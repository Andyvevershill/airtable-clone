import type { Column } from "@/types/column";
import type { RowWithCells } from "@/types/row";

import { useState } from "react";
import { TableSidebar } from "../base-by-id/navigation/table-sidebar";
import { Table } from "./table";
import { TableToolbar } from "./table-toolbar";

interface Props {
  tableId: string;
  columns: Column[];
  rowsWithCells: RowWithCells[];
  rowCount: number;
  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
}
// table-container.tsx
export default function TableContainer({
  tableId,
  columns,
  rowsWithCells,
  rowCount,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <TableToolbar sideBarState={[sidebarOpen, setSidebarOpen]} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - fixed width, no scroll */}
        {sidebarOpen && (
          <div className="flex-shrink-0">
            <TableSidebar sidebarOpen={sidebarOpen} />
          </div>
        )}

        {/* Table - takes remaining space, scrolls independently */}
        <div className="flex-1 overflow-hidden">
          <Table
            tableId={tableId}
            columns={columns}
            rows={rowsWithCells}
            rowCount={rowCount}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />
        </div>
      </div>
    </div>
  );
}
