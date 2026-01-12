import type { RowWithCells } from "@/types/row";
import type { CellContext } from "@tanstack/react-table";
import { useEffect, useRef, useState } from "react";

interface EditableCellProps<
  TData extends { _rowId: string },
  TValue,
> extends CellContext<TData, TValue> {
  rows: RowWithCells[];
  columnId: string;
  onCellUpdate: (cellId: string, value: string | null) => void;
  dataType: string;
}

export default function EditableCell<TData extends { _rowId: string }, TValue>({
  getValue,
  row,
  rows,
  columnId,
  onCellUpdate,
  dataType,
}: EditableCellProps<TData, TValue>) {
  const initialValue = (getValue() as string | null) ?? "";
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);

  const originalRow = rows.find((r) => r.id === row.original._rowId);
  const cell = originalRow?.cells.find((c) => c.columnId === columnId);

  useEffect(() => {
    if (!isEditing) {
      setValue(initialValue);
    }
  }, [initialValue, isEditing]);

  const commit = () => {
    const trimmed = value.trim() || null;
    if (trimmed !== initialValue && cell) {
      onCellUpdate(cell.id, trimmed);
    }
    setIsEditing(false);
  };

  const cancel = () => {
    setValue(initialValue);
    setIsEditing(false);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) return;

    // Enter or F2 -> edit
    if (e.key === "Enter" || e.key === "F2") {
      e.preventDefault();
      setIsEditing(true);
      return;
    }

    // Any printable character -> edit with that char
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      setValue(e.key);
      setIsEditing(true);
      return;
    }

    // Arrow keys, Tab -> handled by parent table
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    } else if (e.key === "Tab") {
      e.preventDefault();
      commit();
      // Let parent handle tab navigation
      setTimeout(() => {
        const event = new KeyboardEvent("keydown", {
          key: "Tab",
          bubbles: true,
          cancelable: true,
        });
        cellRef.current?.dispatchEvent(event);
      }, 0);
    }
  };

  if (!cell) return null;

  return (
    <div
      ref={cellRef}
      tabIndex={0}
      className="h-full w-full outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
      onKeyDown={handleCellKeyDown}
      onDoubleClick={() => setIsEditing(true)}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type={dataType}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onBlur={commit}
          className="h-full w-full border-2 border-blue-500 bg-white px-3 text-[13px] outline-none"
        />
      ) : (
        <div className="flex h-full w-full items-center px-3 text-[13px]">
          {value ?? ""}
        </div>
      )}
    </div>
  );
}
