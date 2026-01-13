"use client";

import type { TransformedRow } from "@/types/row";
import type { CellContext } from "@tanstack/react-table";
import { useEffect, useRef, useState } from "react";

export type Props = CellContext<TransformedRow, unknown> & {
  columnId: string;
  dataType: string;
  onCellUpdate: (rowId: string, columnId: string, value: string | null) => void;
};
export default function EditableCell({
  getValue,
  row,
  columnId,
  onCellUpdate,
  dataType,
}: Props) {
  const cellId = row.original._cellMap[columnId];

  const initialValueRef = useRef<string | null>(
    (getValue() as string | null) ?? "",
  );

  const liveValueRef = useRef<string | null>(initialValueRef.current);
  const [isEditing, setIsEditing] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log("MOUNT", row.original._rowId, columnId);
    return () => {
      console.log("UNMOUNT", row.original._rowId, columnId);
    };
  }, []);

  useEffect(() => {
    if (!isEditing) {
      const next = (getValue() as string | null) ?? "";
      initialValueRef.current = next;
      liveValueRef.current = next;
    }
  }, [getValue, isEditing]);

  const commit = () => {
    if (!isEditing) return;

    const next = liveValueRef.current?.trim() ?? null;

    if (next !== initialValueRef.current && cellId) {
      onCellUpdate(row.original._rowId, columnId, next);
      initialValueRef.current = next;
    }

    setIsEditing(false);
  };

  const cancel = () => {
    liveValueRef.current = initialValueRef.current;
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (dataType !== "number") return;

    const allowedKeys = [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      ".",
      "-",
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Tab",
      "Enter",
      "Escape",
    ];

    if (!allowedKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (!cellId) return null;

  const isNumber = dataType === "number";

  return (
    <div
      tabIndex={0}
      className="h-full w-full outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
      onDoubleClick={() => setIsEditing(true)}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          inputMode={isNumber ? "numeric" : "text"}
          pattern={isNumber ? "[0-9]*" : undefined}
          defaultValue={initialValueRef.current ?? ""}
          onChange={(e) => {
            liveValueRef.current = e.target.value;
          }}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          onKeyDownCapture={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
          className={`h-full w-full border-2 ${
            isNumber ? "text-right" : ""
          } border-blue-500 bg-white px-3 text-[13px] outline-none`}
        />
      ) : (
        <div
          className={`flex h-full w-full items-center px-3 text-[13px] ${
            isNumber ? "justify-end" : ""
          }`}
        >
          {initialValueRef.current ?? ""}
        </div>
      )}
    </div>
  );
}
