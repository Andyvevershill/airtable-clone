"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { View } from "@/server/db/schemas";
import { TableCellsSplit } from "lucide-react";
import { useState } from "react";
import { AiOutlinePlus } from "react-icons/ai";
import { BsCalendar2Date } from "react-icons/bs";
import { FaTents, FaWpforms } from "react-icons/fa6";
import { LuChartGantt } from "react-icons/lu";
import { MdChecklist, MdOutlineTableRows, MdTimeline } from "react-icons/md";
import { RiGalleryView2 } from "react-icons/ri";
import { TbLayoutKanban } from "react-icons/tb";
import { CreateViewForm } from "../forms/create-view-form";

interface Props {
  viewLength: number;
  tableId: string;

  setViews: React.Dispatch<React.SetStateAction<View[]>>;
}

function Badge() {
  return (
    <div className="flex h-[18px] w-[60px] flex-row items-center gap-1 rounded-full bg-[#C4ECFF] px-2 text-[#0f68a2]">
      <FaTents className="h-4 w-4 text-[#0f68a2]" />
      <p className="text-[11px] font-normal text-[#0f68a2]">Team</p>
    </div>
  );
}

const viewTypes = [
  {
    icon: BsCalendar2Date,
    title: "Calendar",
    iconColour: "#E85D75",
  },
  { icon: RiGalleryView2, title: "Gallery", iconColour: "#9B6DD6" },
  { icon: TbLayoutKanban, title: "Kanban", iconColour: "#5FB878" },
  {
    icon: MdTimeline,
    title: "Timeline",
    iconColour: "#E89A3C",
    badge: true,
  },
  { icon: MdChecklist, title: "List", iconColour: "#4A90E2" },
  {
    icon: LuChartGantt,
    title: "Gantt",
    iconColour: "#5FB878",
    badge: true,
  },
];

export function CreateViewDropdown({ tableId, viewLength, setViews }: Props) {
  const [showCreateGrid, setShowCreateGrid] = useState(false);
  const [open, setOpen] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setShowCreateGrid(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateGrid(false);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button className="pointer flex h-9 w-full items-center gap-2 rounded px-2 hover:bg-gray-100">
          <AiOutlinePlus size={18} className="text-gray-600" />
          <span className="text-[13px]">Create new...</span>
        </button>
      </DropdownMenuTrigger>

      {/*  create a round badge  */}
      <DropdownMenuContent
        side="right"
        align="start"
        sideOffset={8}
        className="flex min-w-[250px] flex-col gap-1 p-3"
      >
        {!showCreateGrid ? (
          <>
            <DropdownMenuItem
              className="pointer flex items-center gap-1 text-[13px]"
              onClick={() => setShowCreateGrid(true)}
              onSelect={(e) => e.preventDefault()}
            >
              <TableCellsSplit size={16} color="#4A90E2" className="mr-1" />
              Grid
            </DropdownMenuItem>
            {viewTypes.map((viewType) => (
              <DropdownMenuItem
                key={viewType.title}
                className="pointer flex items-center gap-2 text-[13px]"
              >
                <viewType.icon size={16} color={viewType.iconColour} />
                {viewType.title}
                {viewType.badge && Badge()}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            <DropdownMenuItem className="pointer flex items-center text-[13px]">
              <FaWpforms size={16} color={"#EC4899"} />
              Form
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="pointer flex items-center text-[13px]">
              <MdOutlineTableRows size={16} color={"2D3436"} />
              Section
              {Badge()}
            </DropdownMenuItem>
          </>
        ) : (
          <CreateViewForm
            setViews={setViews}
            viewLength={viewLength}
            tableId={tableId}
            onCancel={() => setShowCreateGrid(false)}
            onSuccess={handleCreateSuccess}
          />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
