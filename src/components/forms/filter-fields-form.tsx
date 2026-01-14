import type { TransformedRow } from "@/types";
import type { Column } from "@tanstack/react-table";
import { HelpCircle } from "lucide-react";
import { useState } from "react";
import { AiOutlinePlus } from "react-icons/ai";
import { PiDotsSixVertical } from "react-icons/pi";
import { RiDeleteBinLine } from "react-icons/ri";
import { DropdownMenuSeparator } from "../ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface Props {
  columns: Column<TransformedRow, unknown>[];
  onClose: () => void;
}

type Filter = {
  id: string;
  fieldId: string | null;
  operator: string | null;
  value: string | number | null;
};

export default function FilterFieldsForm({ columns, onClose }: Props) {
  const [searchColumn, setSearchColumn] = useState("");
  const [searchConditions, setSearchConditions] = useState("");
  const [filters, setFilters] = useState<Filter[]>([
    {
      id: crypto.randomUUID(),
      fieldId: columns[0]?.id ?? null,
      operator: null,
      value: null,
    },
  ]);

  function addFilter() {
    setFilters((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        fieldId: columns[0]?.id ?? null,
        operator: null,
        value: null,
      },
    ]);
  }

  if (!columns.length) return;

  function removeFilter(id: string) {
    setFilters((prev) => prev.filter((filter) => filter.id !== id));
  }

  function editFilter(updates: Filter) {
    setFilters((prev) =>
      prev.map((filter) =>
        filter.id === updates.id ? { ...filter, ...updates } : filter,
      ),
    );
  }

  function getConditions(fieldId: string | null) {
    if (!fieldId || !columns) return [];

    const column = columns.find((col) => col.id === fieldId);
    const dataType = column?.columnDef.meta?.dataType ?? "string";

    if (dataType === "number") {
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
  }

  function getInputType(fieldId: string | null): string {
    if (!fieldId || !columns) return "text";

    const column = columns.find((col) => col.id === fieldId);
    const dataType = column?.columnDef.meta?.dataType ?? "string";

    return dataType === "number" ? "number" : "text";
  }

  function shouldShowValueInput(operator: string | null): boolean {
    if (!operator) return true;
    return !["isEmpty", "isNotEmpty"].includes(operator);
  }

  const filteredColumns = columns.filter((column) => {
    const label = (column.columnDef.meta?.label ?? column.id).toLowerCase();
    return label.includes(searchColumn.toLowerCase());
  });

  // function handleCancel() {
  //   // Reset filters to initial state
  //   setFilters([
  //     {
  //       id: crypto.randomUUID(),
  //       fieldId: columns[0]?.id ?? null,
  //       operator: getConditions(columns[0]?.id ?? null)[0]?.value ?? null,
  //       value: null,
  //     },
  //   ]);

  //   setSearchColumn("");
  //   setSearchConditions("");

  //   onClose();
  // }

  // function handleApply() {
  //   console.log("Applying filters:", filters);
  //   onClose();
  // }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-full w-full flex-col gap-2 px-4 py-3">
        <div className="flex flex-row items-center gap-1 text-gray-500">
          <p className="text-[13px] font-normal">Filter</p>
        </div>

        <DropdownMenuSeparator />

        <p className="mt-2 text-[13px] font-normal text-gray-500">
          In this view, show records
        </p>

        {filters.map((filter) => {
          const conditions = getConditions(filter.fieldId);
          const conditionsArr = conditions.filter((con) =>
            con.value.toLowerCase().includes(searchConditions.toLowerCase()),
          );
          const selectedColumn = columns.find(
            (col) => col.id === filter.fieldId,
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
              <p className="mr-3">Where</p>

              {/* Field Select */}
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
                  className="w-[130px] flex-shrink-0 rounded-xs text-[13px]"
                >
                  <SelectValue placeholder="Select a field">
                    {fieldLabel}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent
                  align="start"
                  position="popper"
                  className="rounded-xs"
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  <div className="flex flex-row items-center rounded-xs px-2">
                    <input
                      type="text"
                      value={searchColumn}
                      onChange={(e) => setSearchColumn(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      placeholder="Find a field"
                      autoFocus
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
                        {label ?? "Untitled field"}
                      </SelectItem>
                    );
                  })}

                  {!filteredColumns.length && (
                    <div className="m-0 flex w-full items-center justify-center">
                      <p className="text-[12px] text-gray-400">No results.</p>
                    </div>
                  )}
                </SelectContent>
              </Select>

              {/* Operator Select */}
              <Select
                value={filter.operator ?? undefined}
                onValueChange={(value) =>
                  editFilter({ ...filter, operator: value })
                }
              >
                <SelectTrigger
                  size="sm"
                  className="w-[130px] flex-shrink-0 rounded-xs text-[13px]"
                >
                  <SelectValue placeholder="Select operator" />
                </SelectTrigger>
                <SelectContent
                  align="start"
                  position="popper"
                  className="rounded-xs"
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  <div className="flex flex-row items-center rounded-xs px-2">
                    <input
                      type="text"
                      value={searchConditions}
                      onChange={(e) => setSearchConditions(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      placeholder="Find an operator"
                      autoFocus
                      className="w-full rounded-xs border-none px-2 py-1.5 text-[13px] outline-none"
                    />
                  </div>

                  {conditionsArr.map((condition) => {
                    return (
                      <SelectItem
                        key={condition.value}
                        value={condition.value}
                        className="truncate text-[13px]"
                      >
                        {condition.label}
                      </SelectItem>
                    );
                  })}

                  {!conditionsArr.length && (
                    <div className="m-0 flex h-10 w-full items-center justify-center">
                      <p className="text-[13px] text-gray-400">No results.</p>
                    </div>
                  )}
                </SelectContent>
              </Select>

              {/* Value Input - only show if operator requires a value */}
              <input
                type={getInputType(filter.fieldId)}
                value={filter.value ?? ""}
                disabled={!shouldShowValueInput(filter.operator)}
                onChange={(e) =>
                  editFilter({
                    ...filter,
                    value: e.target.value,
                  })
                }
                placeholder={
                  !shouldShowValueInput(filter.operator) ? "" : "Enter a value"
                }
                className="h-8 w-[150px] flex-shrink-0 rounded-none border border-gray-200 px-2 text-[13px] outline-none focus:border-2 focus:border-blue-600"
              />

              {/* Remove Button */}
              <button
                onClick={() => removeFilter(filter.id)}
                className="pointer flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-none border border-gray-200 hover:bg-gray-200"
              >
                <RiDeleteBinLine className="h-4 w-4 text-gray-600" />
              </button>

              <button className="pointer flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-none border border-gray-200 hover:bg-gray-200">
                <PiDotsSixVertical className="h-4 w-4 text-gray-900" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex w-full justify-between p-2">
        <div className="ml-1 flex cursor-pointer items-center justify-start gap-2 text-gray-600">
          <div className="ml-1 flex cursor-pointer items-center justify-start gap-1 font-normal hover:text-gray-900">
            <AiOutlinePlus />
            <p onClick={addFilter} className="text-[13px]">
              Add condition
            </p>
          </div>

          <div className="ml-2 flex cursor-pointer items-center justify-start gap-1 text-gray-600 hover:text-gray-900">
            <AiOutlinePlus />
            <p className="pointer text-[13px]">Add condition group</p>
            <HelpCircle size={16} className="pointer text-gray-500" />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="pointer h-7 rounded-xs px-3 text-[13px] text-gray-600 hover:bg-gray-200"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              // Here you would apply the filters
              console.log("Applying filters:", filters);
              onClose();
            }}
            className="pointer h-7 rounded-xs bg-[#166ee1] px-3 text-[13px] text-white hover:bg-[#1557b8]"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
