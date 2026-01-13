"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { TransformedRow } from "@/types";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import type { Column } from "@tanstack/react-table";
import { HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { FaA } from "react-icons/fa6";
import { HiMagnifyingGlass } from "react-icons/hi2";
import { IoFilterOutline } from "react-icons/io5";
import { PiHashStraightLight } from "react-icons/pi";
import SortFieldsForm from "../forms/sort-fields-form";

interface DataTableViewOptionsProps<TData> {
  columns: Column<TransformedRow, unknown>[];
}

export default function SortFieldsDropdown<TData>({
  columns,
}: DataTableViewOptionsProps<TData>) {
  const [search, setSearch] = useState("");
  const [selectedField, setSelectedField] = useState<Column<
    TransformedRow,
    unknown
  > | null>(null);
  const [menuKey, setMenuKey] = useState(0);

  const currentlySortedColumns = columns.filter((col) => col.getIsSorted());

  useEffect(() => {
    if (currentlySortedColumns.length > 0 && !selectedField) {
      setSelectedField(currentlySortedColumns[0] ?? null);
    }
  }, [currentlySortedColumns, selectedField]);

  const filteredColumns = columns.filter((column) => {
    const label = (column.columnDef.meta?.label ?? column.id).toLowerCase();
    return label.includes(search.toLowerCase());
  });

  const handleResetAll = () => {
    setSelectedField(null);
    setSearch("");
    setMenuKey((prev) => prev + 1);
  };

  const showForm = selectedField !== null;

  return (
    <DropdownMenu key={menuKey}>
      <DropdownMenuTrigger asChild>
        <button
          className={`pointer flex h-7 flex-row items-center gap-1 rounded-xs border border-transparent p-2 text-[13px] ${
            currentlySortedColumns.length > 0
              ? "bg-[#FFE0CC] text-gray-900 hover:border-2 hover:border-[#efd5c4]"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          <IoFilterOutline />
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
        // Column Selection Menu
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
                  onClick={() => setSelectedField(column)}
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
        // Sort Form
        <DropdownMenuContent
          align="end"
          className="w-[450px] rounded-xs p-0"
          onEscapeKeyDown={handleResetAll}
          onPointerDownOutside={handleResetAll}
          onInteractOutside={handleResetAll}
          onCloseAutoFocus={handleResetAll}
        >
          <SortFieldsForm
            selectedFieldState={[selectedField, setSelectedField]}
            columns={columns}
            onClose={handleResetAll}
          />
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
}
