import { cn } from "@/lib/utils";
import type { Column } from "@tanstack/react-table";
import { EyeOff } from "lucide-react";
import React, { useState } from "react";
import { FaA } from "react-icons/fa6";
import { GoPencil, GoSortAsc, GoSortDesc } from "react-icons/go";
import { HiOutlineDuplicate } from "react-icons/hi";
import { HiArrowLeft, HiArrowRight, HiOutlineLink } from "react-icons/hi2";
import { IoIosArrowDown, IoIosInformationCircleOutline } from "react-icons/io";
import { PiHashStraightLight } from "react-icons/pi";
import { RiDeleteBinLine } from "react-icons/ri";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CgFileDocument } from "react-icons/cg";
import { CiLock } from "react-icons/ci";
import { IoFilterOutline } from "react-icons/io5";

interface DataTableColumnHeaderProps<
  TData,
  TValue,
> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
  dataType: string;
}

export function ColumnTypeIcon({ type }: { type?: string }) {
  switch (type) {
    case "number":
      return <PiHashStraightLight className="h-4 w-4 text-gray-900" />;
    case "string":
      return <FaA className="h-3 w-3 text-gray-600" />;

    default:
      return null;
  }
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  dataType,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const [showTrigger, setShowTrigger] = useState(false);

  if (!column.getCanSort()) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <ColumnTypeIcon type={dataType} />
        <span>{title}</span>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setShowTrigger(true)}
      onMouseLeave={() => setShowTrigger(false)}
      className={cn(
        "flex w-full items-center gap-1 overflow-hidden",
        className,
      )}
    >
      {/* LEFT SIDE (icon + title) */}
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
        <ColumnTypeIcon type={dataType} />

        {/* THIS is where truncate must live */}
        <span className="truncate">{title}</span>
      </div>

      {/* RIGHT SIDE (dropdown trigger) */}
      <DropdownMenu>
        <DropdownMenuTrigger
          asChild
          className={cn(
            "pointer flex flex-shrink-0 items-center justify-center hover:bg-transparent",
            showTrigger ? "opacity-100" : "opacity-0",
          )}
        >
          <button tabIndex={-1}>
            <IoIosArrowDown className="h-3 w-3 text-gray-500" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="center"
          className="flex w-[320px] flex-col gap-1 p-3"
        >
          <DropdownMenuItem className="pointer text-[13px]">
            <GoPencil className="text-muted-foreground/70 mr-2 h-3.5 w-3.5" />
            Edit field
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1" />

          <DropdownMenuItem className="pointer text-[13px]">
            <HiOutlineDuplicate className="text-muted-foreground/70 mr-2 h-3.5 w-3.5" />
            Duplicate field
          </DropdownMenuItem>

          <DropdownMenuItem className="pointer text-[13px]">
            <HiArrowLeft className="text-muted-foreground/70 mr-2 h-3.5 w-3.5" />
            Insert left
          </DropdownMenuItem>

          <DropdownMenuItem className="pointer text-[13px]">
            <HiArrowRight className="text-muted-foreground/70 mr-2 h-3.5 w-3.5" />
            Insert right
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1" />

          <DropdownMenuItem className="pointer text-[13px]">
            <HiOutlineLink className="text-muted-foreground/70 mr-2 h-3.5 w-3.5" />
            Copy field URL
          </DropdownMenuItem>

          <DropdownMenuItem className="pointer text-[13px]">
            <IoIosInformationCircleOutline className="text-muted-foreground/70 mr-2 h-3.5 w-3.5" />
            Edit field description
          </DropdownMenuItem>

          <DropdownMenuItem className="pointer text-[13px]">
            <CiLock className="text-muted-foreground/70 mr-2 h-3.5 w-3.5" />
            Edit field permissions
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1" />

          <DropdownMenuItem
            className="pointer text-[13px]"
            onClick={() => column.toggleSorting(false)}
          >
            <GoSortAsc className="text-muted-foreground/70 mr-2 h-3.5 w-3.5" />
            Sort {dataType === "number" ? "1-9" : "A-Z"}
          </DropdownMenuItem>

          <DropdownMenuItem
            className="pointer text-[13px]"
            onClick={() => column.toggleSorting(true)}
          >
            <GoSortDesc className="text-muted-foreground/70 mr-2 h-3.5 w-3.5" />
            Sort {dataType === "number" ? "9-1" : "Z-A"}
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1" />

          <DropdownMenuItem className="pointer text-[13px]">
            <IoFilterOutline className="text-muted-foreground/70 mr-2 h-3.5 w-3.5" />
            Filter by this field
          </DropdownMenuItem>

          <DropdownMenuItem className="pointer text-[13px]">
            <CgFileDocument className="text-muted-foreground/70 mr-2 h-3.5 w-3.5" />
            Group by this field
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1" />

          <DropdownMenuItem
            onClick={() => column.toggleVisibility(false)}
            className="pointer text-[13px]"
          >
            <EyeOff className="text-muted-foreground/70 mr-2 h-3.5 w-3.5" />
            Hide field
          </DropdownMenuItem>

          <DropdownMenuItem
            className="pointer text-[13px]"
            onClick={() => console.log("delete")}
          >
            <RiDeleteBinLine className="text-muted-foreground/70 mr-2 h-3.5 w-3.5" />
            <p className="text-red-600"> Delete field</p>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
