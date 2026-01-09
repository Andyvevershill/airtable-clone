"use client";

import type { FullTableData } from "@/types/table";
import type { ColumnDef } from "@tanstack/react-table";
import { AlignLeft, CheckCircle, FileText, Info, User } from "lucide-react";
import { DataTable, type TableRow } from "./table";

interface Props {
  tableData: FullTableData;
}

function HeaderIcon({ name }: { name: string }) {
  switch (name) {
    case "Name":
      return <span className="text-[13px] font-medium text-gray-600">A</span>;

    case "Notes":
      return <AlignLeft size={14} className="text-gray-600" />;

    case "Assignee":
      return <User size={14} className="text-gray-600" />;

    case "Status":
      return <CheckCircle size={14} className="text-gray-600" />;

    case "Attachments":
      return <FileText size={14} className="text-gray-600" />;

    case "Attachment…":
      return (
        <div className="flex items-center gap-1">
          <AlignLeft size={14} className="text-gray-600" />
          <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
        </div>
      );

    default:
      return null;
  }
}

export function TableContainer({ tableData }: Props) {
  const columns: ColumnDef<TableRow>[] = tableData.columns
    .sort((a, b) => a.position - b.position)
    .map((col) => ({
      accessorKey: col.id,

      header: () => (
        <div className="flex items-center gap-2 text-[13px] font-medium text-gray-800">
          <HeaderIcon name={col.name} />
          <span>{col.name}</span>
          {col.name === "Attachment…" && (
            <Info size={12} className="ml-1 text-gray-400" />
          )}
        </div>
      ),

      cell: () => <span className="text-[13px] text-gray-900"></span>,
    }));

  const data = tableData.rows
    .sort((a, b) => a.position - b.position)
    .map((row) => {
      const rowData: Record<string, string | null> & {
        _rowId: string;
      } = {
        _rowId: row.id,
      };

      row.cells.forEach((cell) => {
        rowData[cell.columnId] = cell.value;
      });

      return rowData;
    });

  return <DataTable columns={columns} data={data} />;
}
