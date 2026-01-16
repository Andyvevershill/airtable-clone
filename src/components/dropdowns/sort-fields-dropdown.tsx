"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { TransformedRow } from "@/types";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import type { Table } from "@tanstack/react-table";
import { HelpCircle } from "lucide-react";
import { useState } from "react";
import { BiSortAlt2 } from "react-icons/bi";
import { FaA } from "react-icons/fa6";
import { HiMagnifyingGlass } from "react-icons/hi2";
import { PiHashStraightLight } from "react-icons/pi";
import SortFieldsForm from "../forms/sort-fields-form";

interface Props {
  table: Table<TransformedRow>;
}

export default function SortFieldsDropdown({ table }: Props) {
  const [search, setSearch] = useState("");
  const [initialColumnId, setInitialColumnId] = useState<string | null>(null);
  const [menuKey, setMenuKey] = useState(0);

  const columns = table.getAllColumns();
  const currentlySortedColumns = columns.filter((col) => col.getIsSorted());

  const filteredColumns = columns.filter((column) => {
    const label = (column.columnDef.meta?.label ?? column.id).toLowerCase();
    return label.includes(search.toLowerCase());
  });

  const handleResetAll = () => {
    setInitialColumnId(null);
    setSearch("");
    setMenuKey((prev) => prev + 1);
  };

  const showForm =
    initialColumnId !== null || currentlySortedColumns.length > 0;

  return (
    <DropdownMenu key={menuKey}>
      <DropdownMenuTrigger asChild>
        <button
          className={`pointer flex h-6.5 flex-row items-center gap-1 rounded-sm border border-transparent p-2 text-[13px] ${
            currentlySortedColumns.length > 0
              ? "bg-[#FFE0CC] text-gray-900 hover:border-2 hover:border-[#FFCCAA]"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          <BiSortAlt2 size={16} />
          {currentlySortedColumns.length === 0 ? (
            <span className="text-[13px]">Sort</span>
          ) : (
            <span className="text-[13px]">
              Sorted by {currentlySortedColumns.length} field
              {currentlySortedColumns.length > 1 && "s"}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      {!showForm ? (
        // Picker: only when nothing sorted
        <DropdownMenuContent
          align="end"
          className="mb-2 w-[320px] rounded-xs"
          onEscapeKeyDown={handleResetAll}
          onPointerDownOutside={handleResetAll}
          onInteractOutside={handleResetAll}
        >
          <div className="mx-3 my-2 mb-2 flex flex-row items-center gap-1 text-gray-500">
            <p className="text-[13px] font-normal">Sort by</p>
            <HelpCircle size={16} className="pointer text-gray-500" />
          </div>

          <DropdownMenuSeparator />

          <div className="ml-2 flex flex-row items-center gap-1 rounded-xs px-2 hover:bg-gray-100">
            <HiMagnifyingGlass className="h-4 w-4 text-blue-600" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find a field"
              className="w-full rounded-xs border-none px-2 py-1.5 text-[13px] outline-none"
            />
          </div>

          <div className="mb-2 px-1">
            {filteredColumns.map((column) => {
              const label = column.columnDef.meta?.label ?? column.id;
              const dataType = column.columnDef.meta?.dataType ?? "string";

              return (
                <div
                  key={column.id}
                  className="flex h-7 cursor-pointer flex-row rounded-xs px-3 py-1 hover:bg-gray-100"
                  onClick={() => setInitialColumnId(column.id)}
                >
                  <div className="ml-1 flex flex-row items-center gap-2">
                    {dataType === "number" ? (
                      <PiHashStraightLight className="h-4 w-4 text-gray-900" />
                    ) : (
                      <FaA className="h-3 w-3 text-gray-600" />
                    )}
                    <span className="ml-1 text-[13px]">{label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {!filteredColumns.length && (
            <div className="mt-2 ml-2 flex h-25 items-center justify-center gap-4">
              <p className="text-[14px] text-gray-400">No results.</p>
            </div>
          )}
        </DropdownMenuContent>
      ) : (
        // Form: shown when we have initial click or existing sorts
        <DropdownMenuContent
          align="end"
          className="w-[450px] rounded-xs p-0"
          onEscapeKeyDown={handleResetAll}
          onPointerDownOutside={handleResetAll}
          onInteractOutside={handleResetAll}
          onCloseAutoFocus={handleResetAll}
        >
          <SortFieldsForm
            columns={columns}
            currentSorting={table.getState().sorting}
            initialSelectedColumnId={initialColumnId ?? undefined}
            onClose={handleResetAll}
            onApply={(newSorting) => {
              table.setSorting(newSorting);
            }}
          />
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
}
