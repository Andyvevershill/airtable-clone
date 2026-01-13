"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { TransformedRow } from "@/types";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import type { Column } from "@tanstack/react-table";
import { useState } from "react";
import { FaA } from "react-icons/fa6";
import { IoFilterOutline } from "react-icons/io5";
import { PiHashStraightLight } from "react-icons/pi";
import Toggle from "../ui/toggle";

interface DataTableViewOptionsProps<TData> {
  columns: Column<TransformedRow, unknown>[];
}

export default function FilerFieldsDropdown<TData>({
  columns,
}: DataTableViewOptionsProps<TData>) {
  const [search, setSearch] = useState("");

  const currentlyFilteredColumns = columns.filter((col) => col.getIsFiltered());

  const filteredColumnLabels = currentlyFilteredColumns.map(
    (col) => col.columnDef.meta?.label,
  );
  const filteredColumns = columns.filter((column) => {
    const label = (column.columnDef.meta?.label ?? column.id).toLowerCase();
    return label.includes(search.toLowerCase());
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`pointer flex h-7 flex-row items-center gap-1 rounded-xs border border-transparent p-2 text-[13px] text-gray-700 ${
            currentlyFilteredColumns.length > 0
              ? "bg-[#cff5d1] text-gray-900 hover:border-2 hover:border-[#7FAFC4] hover:bg-[#cff5d1]"
              : "text-gray-500 hover:bg-gray-100"
          } `}
        >
          <IoFilterOutline />

          {currentlyFilteredColumns.length === 0 ? (
            <span className="text-[13px] text-gray-500">Filter</span>
          ) : (
            <span className="text-[13px]">
              Filtered by {filteredColumnLabels.slice(0, 2).join(", ")}
              {filteredColumnLabels.length > 2 &&
                ` +${filteredColumnLabels.length - 2}`}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[320px] rounded-xs">
        <div className="px-3 pt-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a field"
            className="w-full rounded-xs border-none px-2 py-1.5 text-[13px] outline-none"
          />
        </div>

        <DropdownMenuSeparator />

        {filteredColumns.map((column) => {
          const label = column.columnDef.meta?.label ?? column.id;
          const dataType = column.columnDef.meta?.dataType ?? "string";

          return (
            <div
              key={column.id}
              className="mx-3 my-2 mb-2 flex cursor-pointer flex-row gap-2 rounded-xs px-2 hover:bg-gray-100"
              onClick={() => column.toggleVisibility(!column.getIsVisible())}
            >
              <Toggle
                checked={column.getIsVisible()}
                onChange={(value) => column.toggleVisibility(value)}
              />

              <div className="ml-2 flex flex-row items-center gap-2">
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

        {!filteredColumns.length && (
          <div className="mt-2 ml-2 flex h-25 flex-row items-baseline gap-4">
            <p className="text-[13px] text-gray-400">No results.</p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
