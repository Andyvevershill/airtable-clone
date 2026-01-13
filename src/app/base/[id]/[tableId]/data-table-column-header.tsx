import ColumnActionDropdown from "@/components/dropdowns/column-actions-dropdown";
import type { Column } from "@tanstack/react-table";
import React, { useState } from "react";
import { FaA } from "react-icons/fa6";
import { PiHashStraightLight } from "react-icons/pi";

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
}: DataTableColumnHeaderProps<TData, TValue>) {
  const [showTrigger, setShowTrigger] = useState(false);

  return (
    <div
      onMouseEnter={() => setShowTrigger(true)}
      onMouseLeave={() => setShowTrigger(false)}
      className="flex w-full items-center gap-1 overflow-hidden"
    >
      {/* LEFT SIDE (icon + title) */}
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
        <ColumnTypeIcon type={dataType} />

        {/* THIS is where truncate must live */}
        <span className="truncate">{title}</span>
      </div>

      <ColumnActionDropdown
        column={column}
        showTrigger={showTrigger}
        dataType={dataType}
      />
    </div>
  );
}
