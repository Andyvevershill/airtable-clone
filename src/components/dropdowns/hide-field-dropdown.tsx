"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import type { Table } from "@tanstack/react-table";
import { useState } from "react";
import { BiHide } from "react-icons/bi";
import { FaA } from "react-icons/fa6";
import { PiHashStraightLight } from "react-icons/pi";
import Toggle from "../ui/toggle";

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

export default function HideFieldsDropdown<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  const [search, setSearch] = useState("");

  // change button text if hidden cols exist
  const numberOfHiddenCols = table
    .getAllColumns()
    .filter((col) => !col.getIsVisible()).length;

  const hideableColumns = table
    .getAllColumns()
    .filter(
      (column) =>
        typeof column.accessorFn !== "undefined" && column.getCanHide(),
    );

  const filteredColumns = hideableColumns.filter((column) => {
    const label = (column.columnDef.meta?.label ?? column.id).toLowerCase();
    return label.includes(search.toLowerCase());
  });

  const hideAllColumns = () => {
    hideableColumns.forEach((column) => {
      if (column.getIsVisible()) {
        column.toggleVisibility(false);
      }
    });
  };

  const showAllColumns = () => {
    hideableColumns.forEach((column) => {
      if (!column.getIsVisible()) {
        column.toggleVisibility(true);
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`pointer flex h-7 flex-row items-center gap-1 rounded-xs border border-transparent p-2 text-[13px] text-gray-700 ${
            numberOfHiddenCols > 0
              ? "bg-[#C4ECFF] text-gray-900 hover:border-2 hover:border-[#7FAFC4] hover:bg-[#C4ECFF]"
              : "text-gray-700 hover:bg-gray-100"
          } `}
        >
          <BiHide />

          {numberOfHiddenCols === 0 ? (
            <span className="text-[13px]">Hide fields</span>
          ) : (
            <span className="text-[13px]">
              {numberOfHiddenCols} hidden field{numberOfHiddenCols > 1 && "s"}
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

        {!filteredColumns.length ? (
          <div className="mt-2 ml-2 flex h-25 flex-row items-baseline gap-4">
            <p className="text-[13px] text-gray-400">No results.</p>
            <p
              onClick={() => {
                setSearch("");
              }}
              className="cursor-pointer text-xs text-gray-400 hover:text-gray-300"
            >
              Clear
            </p>
          </div>
        ) : (
          <div className="mx-3 mr-2 mb-4 flex flex-row items-center justify-between gap-4">
            <button
              className="pointer h-6 w-full rounded-xs bg-gray-100 hover:bg-gray-200"
              onClick={hideAllColumns}
            >
              <span className="items-center text-[12px] text-gray-700 hover:text-gray-800">
                Hide all
              </span>
            </button>

            <button
              className="pointer h-6 w-full rounded-xs bg-gray-100 hover:bg-gray-200"
              onClick={showAllColumns}
            >
              <span className="items-center text-[12px] text-gray-700 hover:text-gray-800">
                Show all
              </span>
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
