"use client";

import { Search, TableCellsSplit } from "lucide-react";
import { AiOutlinePlus } from "react-icons/ai";
import Add100kRowButton from "../buttons/add-100k-rows-button";

interface Props {
  sidebarOpen: boolean;
  tableId: string;
}

export function TableSidebar({ sidebarOpen, tableId }: Props) {
  return (
    <div
      className={`relative h-full border-r border-gray-200 bg-white transition-[width] duration-300 ease-out ${
        sidebarOpen ? "w-[265px]" : "w-0"
      }`}
    >
      {/* Prevent interaction when closed */}
      <div
        className={`flex h-full flex-col justify-between overflow-hidden transition-opacity duration-150 ${
          sidebarOpen ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* TOP SECTION */}
        <div className="space-y-1 px-2 py-2">
          <button className="flex h-9 w-full items-center gap-2 rounded px-2 hover:bg-gray-100">
            <AiOutlinePlus size={18} className="text-gray-600" />
            <span className="text-[13px]">Create New...</span>
          </button>

          <button className="flex h-9 w-full items-center gap-2 rounded px-2 text-gray-500 hover:bg-gray-100">
            <Search size={18} />
            <span className="text-[13px]">Find a view</span>
          </button>

          <button className="flex h-9 w-full items-center gap-2 rounded px-2 hover:bg-gray-100">
            <TableCellsSplit size={18} className="text-blue-500" />
            <span className="text-[13px]">Grid View</span>
          </button>
        </div>

        {/* BOTTOM SECTION */}
        <div className="p-2">
          <Add100kRowButton tableId={tableId} />
        </div>
      </div>
    </div>
  );
}
