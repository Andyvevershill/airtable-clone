"use client";

import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  PaintBucket,
  PanelsTopLeft,
  Search,
  TableCellsSplit,
} from "lucide-react";
import { BiHide, BiSortAlt2 } from "react-icons/bi";
import { BsFilter } from "react-icons/bs";
import { CiMenuBurger, CiShare1 } from "react-icons/ci";

interface Props {
  sideBarState: [open: boolean, setOpen: (v: boolean) => void];
}

const items = [
  { text: "Hide fields", icon: <BiHide /> },
  { text: "Filter", icon: <BsFilter /> },
  { text: "Group", icon: <PanelsTopLeft /> },
  { text: "Sort", icon: <BiSortAlt2 /> },
  { text: "Colour", icon: <PaintBucket /> },
  { text: "Share and sync", icon: <CiShare1 /> },
];

export function TableToolbar({ sideBarState: [open, setOpen] }: Props) {
  return (
    <div className="flex h-12 items-center justify-between border-b border-gray-200 bg-white px-3">
      {/* Left */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen(!open)}
          // onMouseEnter={handleMouseEntry}
          // onMouseLeave={handleMouseLeave}
          className="pointer"
        >
          <CiMenuBurger />
        </button>

        <Button variant="ghost" size="sm" className="pointer gap-2 rounded-xs">
          <TableCellsSplit className="text-blue-600" />
          <span className="text-[13px]">Grid view</span>
          <ChevronDown />
        </Button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 text-gray-500">
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
