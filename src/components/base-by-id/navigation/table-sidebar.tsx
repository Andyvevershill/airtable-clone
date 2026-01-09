"use client";

import { Plus, Search, TableCellsSplit } from "lucide-react";

interface Props {
  sidebarOpen: boolean;
}
export function TableSidebar({ sidebarOpen }: Props) {
  return (
    <div
      className={`relative h-full border-r border-gray-200 bg-white transition-[width] duration-600 ease-out ${sidebarOpen ? "w-70" : "w-0"} `}
    >
      {/* Prevent interaction when closed */}
      <div
        className={`h-full overflow-hidden ${sidebarOpen ? "opacity-100" : "opacity-0"} transition-opacity duration-150`}
      >
        <div className="space-y-1 px-2 py-2">
          <button className="pointer flex h-10 w-full items-center gap-2 rounded px-2 hover:bg-gray-100">
            <Plus size={20} />
            <span className="text-[13px]">Create New...</span>
          </button>

          <button className="flex h-10 w-full items-center gap-2 rounded px-2 text-gray-500 hover:bg-gray-100">
            <Search size={20} />
            <span className="text-[13px] text-gray-500">Find a view</span>
          </button>

          <button className="pointer flex h-10 w-full items-center gap-2 rounded px-2 hover:bg-gray-100">
            <TableCellsSplit size={20} className="text-blue-700" />
            <span className="text-[13px]">Grid View</span>
          </button>
        </div>
      </div>
    </div>
  );
}
