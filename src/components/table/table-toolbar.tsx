"use client";

import { Button } from "@/components/ui/button";
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
import { IoFilterOutline } from "react-icons/io5";
import HideFieldsDropdown from "../dropdowns/hide-fields-dropdown";
import SortFieldsDropdown from "../dropdowns/sort-fields.dropdown";

interface Props {
  table: Table<TransformedRow>;
  sideBarState: [open: boolean, setOpen: (v: boolean) => void];
}

const items = [
  { text: "Colour", icon: <PaintBucket /> },
  { text: "Share and sync", icon: <CiShare1 /> },
];

export function TableToolbar({ table, sideBarState: [open, setOpen] }: Props) {
  const columns = table.getAllColumns();

  return (
    <div className="flex h-12 items-center justify-between border-b border-gray-200 bg-white px-3">
      {/* Left */}
      <div className="flex items-center gap-2">
        <button onClick={() => setOpen(!open)} className="pointer">
          <CiMenuBurger />
        </button>

        <Button variant="ghost" size="sm" className="pointer gap-2 rounded-xs">
          <TableCellsSplit className="text-blue-500" />
          <span className="text-[13px]">Grid view</span>
          <ChevronDown />
        </Button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 text-gray-500">
        <HideFieldsDropdown columns={columns} />

        <Button
          variant="ghost"
          size="sm"
          className="pointer gap-1 rounded-xs"
          style={{ fontWeight: 350 }}
        >
          <IoFilterOutline />
          <span className="text-[13px]">Filter</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="pointer gap-1 rounded-xs"
          style={{ fontWeight: 350 }}
        >
          <PanelsTopLeft />
          <span className="text-[13px]">Group</span>
        </Button>

        <SortFieldsDropdown columns={columns} />

        {items.map((item) => (
          <Button
            key={item.text}
            variant="ghost"
            size="sm"
            className="pointer gap-1 rounded-xs"
            style={{ fontWeight: 350 }}
          >
            {item.icon}
            <span className="text-[13px]">{item.text}</span>
          </Button>
        ))}

        <Button variant="ghost" size="sm" className="ml-2 rounded-xs p-0">
          <Search />
        </Button>
      </div>
    </div>
  );
}
