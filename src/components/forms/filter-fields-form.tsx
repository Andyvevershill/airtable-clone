"use client";

import { useLoadingStore } from "@/app/stores/use-loading-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TransformedRow } from "@/types";
import type { Column, ColumnFiltersState } from "@tanstack/react-table";
import { HelpCircle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { AiOutlinePlus } from "react-icons/ai";
import { PiDotsSixVertical } from "react-icons/pi";
import { RiDeleteBinLine } from "react-icons/ri";

interface FilterRule {
  id: string;
  fieldId: string | null;
  operator: string | null;
  value: string | number | null;
}

interface Props {
  columns: Column<TransformedRow, unknown>[];
  currentFilters: ColumnFiltersState;
  onApply: (filters: ColumnFiltersState) => void;
  onClose: () => void;
}

export default function FilterFieldsForm({
  columns,
  currentFilters,
  onApply,
  onClose,
}: Props) {
  const { setIsFiltering } = useLoadingStore();
  const [filters, setFilters] = useState<FilterRule[]>(() => {
    if (!currentFilters.length) {
      return [];
    }

    return currentFilters.map((f) => {
      const raw = f.value as
        | { operator?: string; value?: string | number }
        | string
        | number
        | null;

      let operator: string | null = null;
      let value: string | number | null = null;

      if (raw && typeof raw === "object" && "operator" in raw) {
        // It's a structured filter object
        operator = typeof raw.operator === "string" ? raw.operator : null;
        value = raw.value ?? null;
      } else if (typeof raw === "string" || typeof raw === "number") {
        // It's a direct primitive value
        value = raw;
      }
      // else raw is null, so value stays null

      return {
        id: crypto.randomUUID(),
        fieldId: f.id,
        operator,
        value,
      };
    });
  });

  const [searchColumn, setSearchColumn] = useState("");
  const [searchConditions, setSearchConditions] = useState("");

  const getConditions = (fieldId: string | null) => {
    const column = columns.find((c) => c.id === fieldId);
    const type = column?.columnDef.meta?.dataType ?? "string";

    if (type === "number") {
      return [
        { value: "greaterThan", label: ">" },
        { value: "lessThan", label: "<" },
        { value: "equals", label: "=" },
      ];
    } else {
      return [
        { value: "contains", label: "contains" },
        { value: "notContains", label: "does not contain" },
        { value: "equals", label: "equals" },
        { value: "isEmpty", label: "is empty" },
        { value: "isNotEmpty", label: "is not empty" },
      ];
    }
  };

  function shouldDisableInput(operator: string | null) {
    if (operator === "isEmpty" || operator === "isNotEmpty") return true;
    else return false;
  }

  const getInputType = (fieldId: string | null) => {
    const column = columns.find((c) => c.id === fieldId);
    return column?.columnDef.meta?.dataType === "number" ? "number" : "text";
  };

  const editFilter = (updated: FilterRule) => {
    setFilters((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  };

  const removeFilter = (id: string) => {
    const newFilters = filters.filter((f) => f.id !== id);

    setFilters(newFilters);

    const validFilters: ColumnFiltersState = newFilters
      .filter((f) => f.fieldId && f.operator)
      .map((f) => ({
        id: f.fieldId!,
        value:
          f.operator === "isEmpty" || f.operator === "isNotEmpty"
            ? null
            : {
                operator: f.operator,
                value: f.value,
              },
      }));

    onApply(validFilters);
  };

  const addFilter = () => {
    setFilters((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        fieldId: null,
        operator: null,
        value: null,
      },
    ]);
  };

  const handleApply = () => {
    const validFilters: ColumnFiltersState = filters
      .filter((f) => f.fieldId && f.operator)
      .map((f) => ({
        id: f.fieldId!,
        value: {
          operator: f.operator,
          value: f.operator ? f.value : null,
        },
      }));

    setIsFiltering(true);
    onApply(validFilters);
    onClose();
  };

  const filteredColumns = columns.filter((col) => {
    const label = col.columnDef.meta?.label ?? col.id;
    return label.toLowerCase().includes(searchColumn.toLowerCase());
  });

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-full w-full flex-col gap-2 px-4 py-3">
        <div className="flex flex-row items-center gap-1 text-gray-600">
          <p className="text-[13px] font-normal">Filter</p>
        </div>

        <div className="flex h-8 w-full flex-row items-center justify-start rounded-sm border border-gray-100 px-2 text-[13px] text-gray-600">
          <Image
            src="/green-icon.png"
            alt="Login illustration"
            width={26}
            height={26}
            priority
          />
          <p className="ml-2 text-gray-500">Describe what you want to see</p>
        </div>

        {filters.length === 0 ? (
          <div className="flex flex-row items-center justify-start gap-2">
            <p className="mt-2 text-[13px] font-normal text-gray-400">
              No filter conditions are applied
            </p>
            <HelpCircle size={16} className="text-gray-400" />
          </div>
        ) : (
          <>
            <p className="mt-2 text-[13px] font-normal text-gray-400">
              In this view, show records
            </p>

            {filters.map((filter) => {
              const conditions = getConditions(filter.fieldId);
              const conditionsArr = conditions.filter((c) =>
                c.label.toLowerCase().includes(searchConditions.toLowerCase()),
              );

              const selectedColumn = columns.find(
                (c) => c.id === filter.fieldId,
              );

              const fieldLabel =
                selectedColumn?.columnDef.meta?.label ??
                filter.fieldId ??
                "Select a field";

              return (
                <div
                  key={filter.id}
                  className="my-1 ml-4 flex flex-row items-center text-[13px]"
                >
                  <div className="w-25">
                    <p className="mr-3">
                      {filters[0] === filter ? "Where" : "and"}
                    </p>
                  </div>

                  {/* Field */}
                  <Select
                    value={filter.fieldId ?? undefined}
                    onValueChange={(value) =>
                      editFilter({
                        ...filter,
                        fieldId: value,
                        operator: null,
                        value: null,
                      })
                    }
                  >
                    <SelectTrigger
                      size="sm"
                      className="w-[130px] flex-shrink-0 rounded-none border-r-0 text-[13px]"
                    >
                      <SelectValue placeholder="Select a field">
                        {fieldLabel}
                      </SelectValue>
                    </SelectTrigger>

                    <SelectContent
                      align="start"
                      position="popper"
                      className="rounded-none"
                      onCloseAutoFocus={(e) => e.preventDefault()}
                    >
                      <div className="px-2">
                        <input
                          value={searchColumn}
                          onChange={(e) => setSearchColumn(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          placeholder="Find a field"
                          className="w-full rounded-xs border-none px-2 py-1.5 text-[13px] outline-none"
                        />
                      </div>

                      {filteredColumns.map((column) => {
                        const label = column.columnDef.meta?.label ?? column.id;
                        return (
                          <SelectItem
                            key={column.id}
                            value={column.id}
                            className="truncate text-[13px]"
                          >
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  {/* Operator */}
                  <Select
                    value={filter.operator ?? undefined}
                    onValueChange={(value) =>
                      editFilter({ ...filter, operator: value })
                    }
                  >
                    <SelectTrigger
                      size="sm"
                      className="w-[130px] flex-shrink-0 rounded-none text-[13px]"
                    >
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>

                    <SelectContent
                      align="start"
                      position="popper"
                      className="rounded-none"
                      onCloseAutoFocus={(e) => e.preventDefault()}
                    >
                      <div className="px-2">
                        <input
                          value={searchConditions}
                          onChange={(e) => setSearchConditions(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          placeholder="Find an operator"
                          className="w-full rounded-xs border-none px-2 py-1.5 text-[13px] outline-none"
                        />
                      </div>

                      {conditionsArr.map((condition) => (
                        <SelectItem
                          key={condition.value}
                          value={condition.value}
                          className="truncate text-[13px]"
                        >
                          {condition.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Value */}
                  <input
                    type={getInputType(filter.fieldId)}
                    value={filter.value ?? ""}
                    disabled={shouldDisableInput(filter.operator)}
                    onChange={(e) =>
                      editFilter({
                        ...filter,
                        value:
                          getInputType(filter.fieldId) === "number"
                            ? Number(e.target.value)
                            : e.target.value,
                      })
                    }
                    placeholder={
                      shouldDisableInput(filter.operator) ? "" : "Enter a value"
                    }
                    className="h-8 w-[150px] flex-shrink-0 rounded-none border-y border-gray-200 px-2 text-[13px] outline-none focus:border-2 focus:border-blue-600"
                  />

                  <button
                    onClick={() => removeFilter(filter.id)}
                    className="pointer flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-none border border-r-0 border-gray-200 hover:bg-gray-100"
                  >
                    <RiDeleteBinLine className="h-4 w-4 text-gray-600" />
                  </button>

                  <button className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-none border border-gray-200 hover:cursor-grab hover:bg-gray-100">
                    <PiDotsSixVertical className="h-4 w-4 text-gray-900" />
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>

      <div className="flex w-full justify-between p-2">
        <div className="ml-1 flex items-center gap-2 text-gray-600">
          <div
            onClick={addFilter}
            className="flex cursor-pointer items-center gap-1 hover:text-gray-900"
          >
            <AiOutlinePlus />
            <p className="text-[13px] font-[450] text-[#166ee1]">
              Add condition
            </p>
          </div>

          <div className="ml-2 flex cursor-pointer items-center gap-1 hover:text-gray-900">
            <AiOutlinePlus />
            <p className="text-[13px]">Add condition group</p>
            <HelpCircle size={16} className="text-gray-500" />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="pointer h-7 rounded-xs px-3 text-[13px] text-gray-600 hover:bg-gray-200"
          >
            Cancel
          </button>

          <button
            onClick={handleApply}
            className="pointer h-7 rounded-xs bg-[#166ee1] px-3 text-[13px] text-white hover:bg-[#1557b8]"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
