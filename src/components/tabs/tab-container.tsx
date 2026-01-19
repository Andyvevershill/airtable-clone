"use client";

import { darkenColour, lightenColour } from "@/lib/utils";
import { api } from "@/trpc/react";
import type { BaseWithTables } from "@/types/base";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { IoChevronDown } from "react-icons/io5";
import { RiArrowDownSLine } from "react-icons/ri";
import { TableTabDropdown } from "../dropdowns/table-tab-dropdown";
import { AddTableButton } from "./add-table-button";

interface Props {
  base: BaseWithTables;
}

export default function TabContainer({ base }: Props) {
  const { tableId } = useParams<{ tableId: string }>();
  const utils = api.useUtils();

  const [tables, setTables] = useState<{ id: string; name: string }[]>(
    base.tables,
  );

  const tabStyle: CSSProperties & {
    "--tab-hover-darken": string;
  } = {
    backgroundColor: lightenColour(base.colour, 0.15),
    "--tab-hover-darken": darkenColour(base.colour, 0.4),
  };

  return (
    <div
      className="flex flex-row items-center justify-between"
      style={tabStyle}
    >
      <div className="flex h-8 w-full flex-row items-center">
        {tables.map((table, index) => {
          const isActive = table.id === tableId;

          return (
            <Link
              key={table.id}
              href={`/base/${base.id}/${table.id}`}
              onMouseEnter={() => {
                if (!isActive) {
                  void utils.table.getTableWithViews.prefetch({
                    tableId: table.id,
                  });
                  void utils.column.getColumns.prefetch({ tableId: table.id });
                }
              }}
              className={`relative flex h-full items-center gap-2 px-4 py-1 text-[13px] transition-colors after:absolute after:top-1/2 after:right-0 after:h-1/3 after:w-px after:-translate-y-1/2 after:bg-[var(--tab-hover-darken)] ${isActive && index === 0 ? "rounded-tr-sm" : "rounded-t-sm"} ${
                isActive
                  ? "bg-white font-normal after:hidden"
                  : "text-gray-500 hover:bg-[var(--tab-hover-darken)]"
              }`}
            >
              {table.name}
              {isActive && <RiArrowDownSLine size={16} />}
            </Link>
          );
        })}

        <TableTabDropdown
          base={base}
          activeTab={tableId}
          setTables={setTables}
        />
        <AddTableButton
          baseId={base.id}
          tableNumber={base.tables.length + 1}
          setTables={setTables}
        />
      </div>
      <div className="pointer mr-4 flex flex-row items-center justify-end gap-2 text-[13px] text-gray-600">
        <p>Tools</p>
        <IoChevronDown />
      </div>
    </div>
  );
}
