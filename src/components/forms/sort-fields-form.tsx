import type { TransformedRow } from "@/types";
import type { Column } from "@tanstack/react-table";
import { HelpCircle } from "lucide-react";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { AiOutlinePlus } from "react-icons/ai";
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
  selectedFieldState: [
    Column<TransformedRow, unknown> | null,
    Dispatch<SetStateAction<Column<TransformedRow, unknown> | null>>,
  ];
  onClose: () => void;
}

type SortOption = {
  value: "asc" | "desc";
  label: string;
};

export default function SortFieldsForm({
  columns,
  selectedFieldState,
  onClose,
}: Props) {
  const [selectedField, setSelectedField] = selectedFieldState;
  const [search, setSearch] = useState("");
  const [selectedColumnId, setSelectedColumnId] = useState<string>(
    selectedField?.id ?? "",
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [sortOptions, setSortOptions] = useState<SortOption[]>([
    { value: "asc", label: "A → Z" },
    { value: "desc", label: "Z → A" },
  ]);

  useEffect(() => {
    if (!columns || !selectedColumnId) return;

    const currentColumn = columns.find((col) => col.id === selectedColumnId);
    if (!currentColumn) return;

    const dataType = currentColumn.columnDef.meta?.dataType ?? "string";

    if (dataType === "number") {
      setSortOptions([
        { value: "asc", label: "1 → 9" },
        { value: "desc", label: "9 → 1" },
      ]);
    } else {
      setSortOptions([
        { value: "asc", label: "A → Z" },
        { value: "desc", label: "Z → A" },
      ]);
    }
  }, [selectedColumnId, columns]);

  if (!selectedField || !columns) return null;

  const handleApplySort = () => {
    const columnToSort = columns.find((col) => col.id === selectedColumnId);

    if (columnToSort) {
      columnToSort.toggleSorting(sortDirection === "desc");
    }

    onClose();
  };

  const filteredColumns = columns.filter((column) => {
    const label = (column.columnDef.meta?.label ?? column.id).toLowerCase();
    return label.includes(search.toLowerCase());
  });

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-full w-full flex-col gap-2 px-4 py-3">
        <div className="flex flex-row items-center gap-1 text-gray-500">
          <p className="text-[13px] font-normal">Sort by</p>
          <HelpCircle size={16} className="pointer text-gray-500" />
        </div>

        <DropdownMenuSeparator />

        <div className="my-1 flex flex-row items-center gap-3">
          <Select value={selectedColumnId} onValueChange={setSelectedColumnId}>
            <SelectTrigger className="h-6 w-[240px] rounded-xs text-[12px]">
              <SelectValue placeholder="Select a field" />
            </SelectTrigger>
            <SelectContent
              align="end"
              position="popper"
              className="rounded-xs"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <div className="flex flex-row items-center gap-1 rounded-xs px-2">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="Find a field"
                  autoFocus
                  className="w-full rounded-xs border-none px-2 py-1.5 text-[12px] outline-none"
                />
              </div>

              {filteredColumns.map((column) => {
                const label = column.columnDef.meta?.label ?? column.id;
                return (
                  <SelectItem
                    key={column.id}
                    value={column.id}
                    className="text-[12px]"
                  >
                    {label ?? "Untitled field"}
                  </SelectItem>
                );
              })}

              {!filteredColumns.length && (
                <div className="m-0 flex h-10 w-full items-center justify-center">
                  <p className="text-[12px] text-gray-400">No results.</p>
                </div>
              )}
            </SelectContent>
          </Select>

          <Select
            value={sortDirection}
            onValueChange={(val) => setSortDirection(val as "asc" | "desc")}
          >
            <SelectTrigger className="h-6 w-[120px] rounded-xs text-[12px]">
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
            onClick={() => {
              setSelectedField(null);
              selectedField.clearSorting();
            }}
            className="pointer flex h-6 w-6 items-center justify-center rounded hover:bg-gray-200"
          >
            <RxCross1 className="h-3 w-3 text-gray-700" />
          </button>
        </div>

        <div className="ml-1 flex cursor-pointer items-center justify-start gap-2 text-gray-500 hover:text-gray-700">
          <AiOutlinePlus /> <p className="text-[13px]">Add another sort</p>
        </div>
      </div>

      <div className="flex w-full justify-between border-t border-gray-200 bg-gray-100 p-2">
        <div className="ml-1 flex items-center justify-start gap-2">
          <Toggle checked={false} onChange={(value) => console.log(value)} />
          <p className="text-[13px]">Automatically sort records</p>
        </div>

        <div className="flex justify-end gap-2">
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
