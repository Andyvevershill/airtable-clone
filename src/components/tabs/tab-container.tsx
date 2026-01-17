"use client";

import { darkenColour, lightenColour } from "@/lib/utils";
import { api } from "@/trpc/react";
import type { BaseWithTables } from "@/types/base";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type CSSProperties } from "react";
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
        {tables.map((table) => {
          const isActive = table.id === tableId;

          return (
            <Link
              key={table.id}
              href={`/base/${base.id}/${table.id}`}
              onMouseEnter={() => {
                if (!isActive) {
                  // preload the core data of chosen tab
                  void utils.table.getTableWithViews.prefetch({
                    tableId: table.id,
                  });
                  void utils.column.getColumns.prefetch({
                    tableId: table.id,
                  });
                }
              }}
              className={`flex h-full items-center gap-2 rounded-t-xs border-r px-4 py-1 text-[13px] transition-colors ${
                isActive
                  ? "bg-white font-normal"
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
      <div className="flex flex-row items-center justify-end">
        <p>test</p>
      </div>
    </div>
  );
}
