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
import { BiHide } from "react-icons/bi";
import { FaA } from "react-icons/fa6";
import { PiHashStraightLight } from "react-icons/pi";
import Toggle from "../ui/toggle";

interface DataTableViewOptionsProps<TData> {
  columns: Column<TransformedRow, unknown>[];
}

export default function HideFieldsDropdown<TData>({
  columns,
}: DataTableViewOptionsProps<TData>) {
  const [search, setSearch] = useState("");

  const numberOfHiddenCols = columns.filter(
    (col) => !col.getIsVisible(),
  ).length;

  const filteredColumns = columns.filter((column) => {
    const label = (column.columnDef.meta?.label ?? column.id).toLowerCase();
    return label.includes(search.toLowerCase());
  });

  const hideAllColumns = () => {
    columns.forEach((column) => column.toggleVisibility(false));
  };

  const showAllColumns = () => {
    columns.forEach((column) => column.toggleVisibility(true));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={() => console.log("🖱️ Hide fields button clicked")}
          className={`pointer flex h-6.5 flex-row items-center gap-1 rounded-sm border border-transparent p-2 text-[13px] ${
            numberOfHiddenCols > 0
              ? "bg-[#C4ECFF] text-gray-900 hover:border-2 hover:border-[#7FAFC4]"
              : "text-gray-500 hover:bg-gray-100"
          }`}
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
            onChange={(e) => {
              console.log("🔍 Search changed:", e.target.value);
              setSearch(e.target.value);
            }}
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
              className="mx-3 my-2 flex flex-row items-center gap-2 rounded-xs px-2 hover:bg-gray-100"
            >
              <div onClick={(e) => e.stopPropagation()}>
                <Toggle
                  checked={column.getIsVisible()}
                  onChange={(value) => {
                    column.toggleVisibility(value);
                  }}
                />
              </div>

              <div
                className="flex flex-1 cursor-pointer flex-row items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  const newValue = !column.getIsVisible();

                  column.toggleVisibility(newValue);
                }}
              >
                {dataType === "number" ? (
                  <PiHashStraightLight className="h-4 w-4 text-gray-900" />
                ) : (
                  <FaA className="h-3 w-3 text-gray-600" />
                )}
                <span className="text-[13px]">{label}</span>
              </div>
            </div>
          );
        })}

        {filteredColumns.length === 0 ? (
          <div className="mx-3 my-4 flex flex-row items-baseline gap-4">
            <p className="text-[13px] text-gray-400">No results.</p>
            <button className="cursor-pointer text-xs text-gray-400 hover:text-gray-300">
              Clear
            </button>
          </div>
        ) : (
          <div className="mx-3 mb-4 flex flex-row items-center gap-2">
            <button
              className="pointer h-6 w-full rounded-xs bg-gray-100 text-[12px] text-gray-700 hover:bg-gray-200"
              onClick={hideAllColumns}
            >
              Hide all
            </button>

            <button
              className="pointer h-6 w-full rounded-xs bg-gray-100 text-[12px] text-gray-700 hover:bg-gray-200"
              onClick={showAllColumns}
            >
              Show all
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
