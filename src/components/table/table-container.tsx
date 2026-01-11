import type { Column } from "@/types/column";
import type { RowWithCells } from "@/types/row";
import { useState } from "react";
import { Table } from "./table";
import { TableSidebar } from "./table-sidebar";
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
    <div className="flex h-full w-full flex-col overflow-hidden bg-slate-100">
      <TableToolbar sideBarState={[sidebarOpen, setSidebarOpen]} />

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <div className="shrink-0">
            <TableSidebar sidebarOpen={sidebarOpen} tableId={tableId} />
          </div>
        )}

        <div className="flex-1 overflow-x-scroll">
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
