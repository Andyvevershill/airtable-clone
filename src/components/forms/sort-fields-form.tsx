import { useViewUpdater } from "@/hooks/use-view-updater";
import { transformSortingToView } from "@/lib/helper-functions";
import type { TransformedRow } from "@/types";
import type { Column, SortingState } from "@tanstack/react-table";
import { HelpCircle } from "lucide-react";
import { useState } from "react";
import { AiOutlinePlus } from "react-icons/ai";
import { PiDotsSixVertical } from "react-icons/pi";
import { RxCross1 } from "react-icons/rx";
import { DropdownMenuSeparator } from "../ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import Toggle from "../ui/toggle";

interface Props {
  columns: Column<TransformedRow, unknown>[] | null;
  currentSorting: SortingState;
  initialSelectedColumnId?: string;
  onClose: () => void;
  onApply: (sorting: SortingState) => void;
}

type SortRule = {
  id: string;
  columnId: string;
  direction: "asc" | "desc";
};

export default function SortFieldsForm({
  columns,
  currentSorting,
  initialSelectedColumnId,
  onClose,
  onApply,
}: Props) {
  const [search, setSearch] = useState("");
  const [sortRules, setSortRules] = useState<SortRule[]>(() => {
    if (!columns || columns.length === 0) return [];

    if (currentSorting.length > 0) {
      return currentSorting.map((sort) => ({
        id: crypto.randomUUID(),
        columnId: sort.id,
        direction: sort.desc ? "desc" : "asc",
      }));
    }

    if (initialSelectedColumnId) {
      return [
        {
          id: crypto.randomUUID(),
          columnId: initialSelectedColumnId,
          direction: "desc",
        },
      ];
    }

    return [
      {
        id: crypto.randomUUID(),
        columnId: columns[0]?.id ?? "",
        direction: "desc",
      },
    ];
  });
  // to update view with sorting when adding/removing
  const { updateViewSorting } = useViewUpdater();

  if (!columns) return null;

  const getAvailableColumns = (currentRuleId: string) => {
    const currentColumnId = sortRules.find(
      (r) => r.id === currentRuleId,
    )?.columnId;

    return (columns || [])
      .filter((col) => {
        if (col.id === currentColumnId) return true;

        return !sortRules.some(
          (r) => r.columnId === col.id && r.id !== currentRuleId,
        );
      })
      .filter((col) => {
        if (!search.trim()) return true;

        const label = col.columnDef.meta?.label ?? col.id;

        return label.toLowerCase().includes(search.toLowerCase());
      });
  };

  const addSortRule = () => {
    if (!columns) return;

    const usedColumnIds = new Set(sortRules.map((r) => r.columnId));
    const availableColumns = columns.filter(
      (col) => !usedColumnIds.has(col.id),
    );

    if (!availableColumns.length) return;

    setSortRules((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        columnId: availableColumns[0]?.id ?? "",
        direction: "desc",
      },
    ]);
  };

  const removeSortRule = (id: string) => {
    const newRules = sortRules.filter((rule) => rule.id !== id);

    setSortRules(newRules);

    const newSorting: SortingState = newRules.map((rule) => ({
      id: rule.columnId,
      desc: rule.direction === "desc",
    }));

    onApply(newSorting);
    updateViewSorting(transformSortingToView(newSorting, columns));

    if (!newRules.length) {
      onClose();
    }
  };

  const updateSortRule = (id: string, updates: Partial<SortRule>) => {
    setSortRules((prev) =>
      prev.map((rule) => (rule.id === id ? { ...rule, ...updates } : rule)),
    );
  };

  const getSortOptions = (columnId: string) => {
    const col = columns?.find((c) => c.id === columnId);
    const dataType = col?.columnDef.meta?.dataType ?? "string";

    return dataType === "number"
      ? [
          { value: "asc", label: "1 → 9" },
          { value: "desc", label: "9 → 1" },
        ]
      : [
          { value: "asc", label: "A → Z" },
          { value: "desc", label: "Z → A" },
        ];
  };

  const handleApplySort = () => {
    const validRules = sortRules.filter((r) => r.columnId.trim() !== "");

    if (!validRules.length) {
      onApply([]);
      onClose();
      return;
    }

    const newSorting: SortingState = validRules.map((rule) => ({
      id: rule.columnId,
      desc: rule.direction === "desc",
    }));

    onApply(newSorting);
    updateViewSorting(transformSortingToView(newSorting, columns));
    onClose();
  };

  if (!columns || columns.length === 0) return null;

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-full w-full flex-col gap-2 px-4 py-3">
        <div className="flex flex-row items-center gap-1 text-gray-500">
          <p className="text-[13px] font-normal">Sort by</p>
          <HelpCircle size={16} />
        </div>

        <DropdownMenuSeparator />

        {sortRules.map((rule) => {
          const sortOptions = getSortOptions(rule.columnId);
          const available = getAvailableColumns(rule.id);

          return (
            <div
              key={rule.id}
              className="my-1 flex flex-row items-center gap-3"
            >
              <Select
                value={rule.columnId}
                onValueChange={(value) =>
                  updateSortRule(rule.id, { columnId: value })
                }
              >
                <SelectTrigger className="h-7 w-[240px] rounded-xs text-[12px]">
                  <SelectValue placeholder="Select a field" />
                </SelectTrigger>

                <SelectContent
                  align="end"
                  position="popper"
                  className="rounded-xs"
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  <div className="px-2">
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Find a field"
                      className="w-full rounded-xs border-none px-2 py-1.5 text-[12px] outline-none"
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>

                  {available.map((column) => {
                    const label = column.columnDef.meta?.label ?? column.id;

                    return (
                      <SelectItem
                        key={column.id}
                        value={column.id}
                        className="text-[12px]"
                      >
                        {label}
                      </SelectItem>
                    );
                  })}

                  {!available.length && (
                    <div className="flex h-10 items-center justify-center">
                      <p className="text-[12px] text-gray-400">
                        No available fields
                      </p>
                    </div>
                  )}
                </SelectContent>
              </Select>

              <Select
                value={rule.direction}
                onValueChange={(val) =>
                  updateSortRule(rule.id, {
                    direction: val as "asc" | "desc",
                  })
                }
              >
                <SelectTrigger className="h-8 w-[120px] rounded-xs text-[12px]">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent
                  className="w-[120px] rounded-xs"
                  align="end"
                  position="popper"
                >
                  {sortOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="text-[12px]"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <button
                onClick={() => removeSortRule(rule.id)}
                className="pointer flex h-6 w-6 items-center justify-center rounded hover:bg-gray-200"
              >
                <RxCross1 className="h-3 w-3 text-gray-500" />
              </button>

              <div className="pointer flex h-8 w-8 flex-shrink-0 items-center justify-center">
                <PiDotsSixVertical className="h-5 w-5 text-gray-500" />
              </div>
            </div>
          );
        })}

        <button
          onClick={addSortRule}
          disabled={sortRules.length >= columns.length}
          className="ml-1 flex cursor-pointer items-center gap-2 text-gray-500 hover:text-gray-700"
        >
          <AiOutlinePlus />
          <p className="text-[13px]">Add another sort</p>
        </button>
      </div>

      <div className="flex w-full justify-between border-t border-gray-200 bg-gray-100 p-2">
        <div className="ml-1 flex items-center gap-2">
          <Toggle
            checked={false}
            onChange={() => {
              console.log("hello");
            }}
          />
          <p className="text-[13px]">Automatically sort records</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="pointer h-7 rounded-xs px-3 text-[13px] text-gray-600 hover:bg-gray-200"
          >
            Cancel
          </button>

          <button
            onClick={handleApplySort}
            className="pointer h-7 rounded-sm bg-[#166ee1] px-3 text-[13px] text-white hover:bg-[#1557b8]"
          >
            Sort
          </button>
        </div>
      </div>
    </div>
  );
}
