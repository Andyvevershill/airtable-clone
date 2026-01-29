"use client";

import { useLoadingStore } from "@/app/stores/use-loading-store";
import { useViewStore } from "@/app/stores/use-view-store";
import { Button } from "@/components/ui/button";
import { showNotFunctionalToast } from "@/lib/utils";
import type { TransformedRow } from "@/types";
import type { Table } from "@tanstack/react-table";
import {
  ChevronDown,
  PaintBucket,
  PanelsTopLeft,
  Search,
  TableCellsSplit,
} from "lucide-react";
import { CiMenuBurger, CiShare1 } from "react-icons/ci";
import { MdFormatLineSpacing } from "react-icons/md";
import FilterFieldsDropdown from "../dropdowns/filter-fields-dropdown";
import HideFieldsDropdown from "../dropdowns/hide-fields-dropdown";
import SortFieldsDropdown from "../dropdowns/sort-fields-dropdown";
import { CreateSearchForm } from "../forms/create-search-form";
import { Skeleton } from "../ui/skeleton";

interface Props {
  table: Table<TransformedRow>;
  sideBarState: [open: boolean, setOpen: (v: boolean) => void];
}

const items = [
  { id: 1, text: "Colour", icon: <PaintBucket /> },
  { id: 2, icon: <MdFormatLineSpacing /> },
  { id: 3, text: "Share and sync", icon: <CiShare1 /> },
];

export function TableToolbar({ table, sideBarState: [open, setOpen] }: Props) {
  const { isLoadingView } = useLoadingStore();
  const { activeView } = useViewStore();

  return (
    <div className="flex h-[47px] items-center justify-between border-b border-gray-200 bg-white px-3">
      {/* Left */}
      <div className="flex items-center gap-2">
        <button onClick={() => setOpen(!open)} className="pointer">
          <CiMenuBurger />
        </button>

        <Button
          variant="ghost"
          size="sm"
          className="pointer gap-2 rounded-xs"
          onClick={showNotFunctionalToast}
        >
          <TableCellsSplit className="text-blue-500" />
          <span className="text-[13px]">{activeView?.name ?? "Grid view"}</span>
          <ChevronDown />
        </Button>
      </div>

      {/* Right */}

      {isLoadingView ? (
        <div className="mr-2 flex flex-row items-center justify-end gap-3">
          <Skeleton className="h-8 w-30 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xs p-0 text-gray-500"
          >
            <Search />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-gray-500">
          <HideFieldsDropdown columns={table.getAllColumns()} />

          <FilterFieldsDropdown table={table} />

          <Button
            variant="ghost"
            size="sm"
            className="pointer h-6.5 gap-1 rounded-xs"
            style={{ fontWeight: 350 }}
            onClick={showNotFunctionalToast}
          >
            <PanelsTopLeft />
            <span className="text-[13px]">Group</span>
          </Button>

          <SortFieldsDropdown table={table} />

          {items.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className="pointer h-6.5 rounded-xs"
              style={{ fontWeight: 450 }}
              onClick={showNotFunctionalToast}
            >
              {item.icon}
              {item.text && <span className="text-[13px]">{item.text}</span>}
            </Button>
          ))}

          <CreateSearchForm />
        </div>
      )}
    </div>
  );
}
