"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import type { TransformedRow } from "@/types";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import type { Table } from "@tanstack/react-table";
import { useState } from "react";
import { IoFilterOutline } from "react-icons/io5";
import FilterFieldsForm from "../forms/filter-fields-form";

interface DataTableViewOptionsProps<TData> {
  table: Table<TransformedRow>;
}

export default function FilterFieldsDropdown<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  const [isOpen, setIsOpen] = useState(false);

  const columns = table.getAllColumns();
  const currentlyFilteredColumns = columns.filter((col) => col.getIsFiltered());

  const filteredColumnsNameArr = currentlyFilteredColumns.map(
    (col) => col.columnDef.meta?.label ?? "Untitled ",
  );

  function handleClose() {
    setIsOpen(false);
  }

  const formatFilteredColumns = (names: string[]) => {
    if (names.length <= 2) return names.join(", ");

    const remaining = names.length - 2;
    return `${names[0]}, ${names[1]} and ${remaining} more`;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={`pointer flex h-6.5 flex-row items-center gap-1 rounded-sm border border-transparent p-2 text-[13px] ${
            currentlyFilteredColumns.length > 0
              ? "bg-[#cff5d1] text-gray-900 hover:border-2 hover:border-[#a5d6a7]"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          <IoFilterOutline />
          {currentlyFilteredColumns.length === 0 ? (
            <span className="text-[13px]">Filter</span>
          ) : (
            <span className="text-[13px]">
              Filtered by {formatFilteredColumns(filteredColumnsNameArr)}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[590px] rounded-xs">
        <FilterFieldsForm
          columns={columns}
          currentFilters={table.getState().columnFilters}
          onApply={(filters) => {
            table.setColumnFilters(filters);
          }}
          onClose={handleClose}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
