"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuSeparator } from "@radix-ui/react-dropdown-menu";
import { BarChart3, Calendar, Grid3x3, KanbanSquare, List } from "lucide-react";
import { useState } from "react";
import { AiOutlinePlus } from "react-icons/ai";
import { CreateViewForm } from "../forms/create-view-form";

interface Props {
  tableId: string;
}

const viewTypes = [
  { icon: Calendar, title: "Calendar", iconColour: "#E85D75" },
  { icon: BarChart3, title: "Gallery", iconColour: "#9B6DD6" },
  { icon: KanbanSquare, title: "Kanban", iconColour: "#5FB878" },
  { icon: List, title: "Form", iconColour: "#E89A3C" },
  { icon: List, title: "Section", iconColour: "#2D3436" },
];

export function CreateViewDropdown({ tableId }: Props) {
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
          <span className="text-[13px]">Create New...</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-[250px] p-3" align="end">
        {!showCreateGrid ? (
          <>
            <DropdownMenuItem
              className="flex items-center gap-2 text-[13px]"
              onClick={() => setShowCreateGrid(true)}
              onSelect={(e) => e.preventDefault()}
            >
              <Grid3x3 size={16} color="#4A90E2" />
              Grid
            </DropdownMenuItem>
            {viewTypes.map((viewType) => (
              <DropdownMenuItem
                key={viewType.title}
                className="flex items-center gap-2 text-[13px]"
              >
                <viewType.icon size={16} color={viewType.iconColour} />
                {viewType.title}
                {viewType.title == "kanban" && <DropdownMenuSeparator />}
              </DropdownMenuItem>
            ))}
          </>
        ) : (
          <CreateViewForm
            tableId={tableId}
            onCancel={() => setShowCreateGrid(false)}
            onSuccess={handleCreateSuccess}
          />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
