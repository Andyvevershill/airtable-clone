"use client";

import { useViewStore } from "@/app/stores/use-view-store";
import {
  darkenColour,
  lightenColour,
  showNotFunctionalToast,
} from "@/lib/utils";
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
  const { reset } = useViewStore();
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
      className="flex flex-row items-center justify-between border-b"
      style={tabStyle}
    >
      <div className="flex h-8 w-full flex-row items-center">
        {tables.map((table, index) => {
          const isActive = table.id === tableId;
          const activeTabIndex = tables.findIndex((t) => t.id === tableId);

          return (
            <Link
              key={table.id}
              href={`/base/${base.id}/${table.id}`}
              onClick={reset}
              onMouseEnter={() => {
                if (!isActive) {
                  void utils.table.getTableWithViews.prefetch({
                    tableId: table.id,
                  });
                }
              }}
              className={`relative flex h-full items-center gap-2 pr-3 pl-2.5 text-[13px] transition-colors after:absolute after:top-1/2 after:right-0 after:h-1/3 after:w-px after:-translate-y-1/2 after:bg-[var(--tab-hover-darken)] ${isActive && index === 0 ? "rounded-tr-[3px] border-l-0" : "rounded-t-[3px]"} ${
                isActive
                  ? "border-r border-l bg-white py-1 font-normal shadow-sm before:absolute before:right-0 before:bottom-[-1px] before:left-0 before:z-10 before:h-[1px] before:bg-white after:hidden"
                  : "py-1 text-gray-500 hover:bg-[var(--tab-hover-darken)]"
              } ${activeTabIndex === index + 1 ? "after:hidden" : "hover:after:hidden"}`}
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
      <div
        className="pointer mr-4 flex flex-row items-center justify-end gap-2 text-[13px] text-gray-600"
        onClick={showNotFunctionalToast}
      >
        <p>Tools</p>
        <IoChevronDown />
      </div>
    </div>
  );
}
