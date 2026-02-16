import type { TransformedRow } from "@/types";
import type { Column } from "@tanstack/react-table";
import { IoFilterOutline } from "react-icons/io5";

interface Props {
  columns: Column<TransformedRow, unknown>[];
}

export default function FilterButton({ columns }: Props) {
  const currentlyFilteredColumns = columns.filter((col) => col.getIsFiltered());

  const filteredColumnsNameArr = currentlyFilteredColumns.map(
    (col) => col.columnDef.meta?.label ?? "Untitled ",
  );

  const formatFilteredColumns = (names: string[]) => {
    if (names.length <= 2) return names.join(", ");

    const remaining = names.length - 2;
    return `${names[0]}, ${names[1]} and ${remaining} more`;
  };

  return (
    <div
      data-testid="filter-button"
      className={`pointer flex h-6.5 flex-row items-center gap-1 rounded-xs border border-transparent p-2 text-[13px] ${
        currentlyFilteredColumns.length > 0
          ? "bg-[#cff5d1] text-gray-900 hover:border-2 hover:border-[#a5d6a7]"
          : "text-gray-500 hover:bg-gray-100"
      }`}
    >
      <IoFilterOutline />
      {currentlyFilteredColumns.length === 0 ? (
        <span className="text-[13px]">Filter</span>
      ) : (
        <span className="text-[13px]">
          Filtered by {formatFilteredColumns(filteredColumnsNameArr)}
        </span>
      )}
    </div>
  );
}
