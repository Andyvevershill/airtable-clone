"use client";

import { useEditableCell } from "@/hooks/use-editable-cell";
import type { TransformedRow } from "@/types/row";
import type { CellContext } from "@tanstack/react-table";

export type Props = CellContext<TransformedRow, unknown> & {
  columnId: string;
  dataType: string;
  onCellUpdate: (
    rowId: string,
    columnId: string,
    value: string | null,
    onSettled: () => void,
  ) => void;
};

export default function EditableCell({
  getValue,
  row,
  columnId,
  dataType,
  onCellUpdate,
}: Props) {
  const rowId = row.original._rowId;
  const cellValue = (getValue() as string | null) ?? "";

  const {
    isEditing,
    inputRef,
    value,
    startEditing,
    commit,
    cancel,
    onChange,
    onKeyDown,
    onInputKeyDown,
  } = useEditableCell({
    initialValue: cellValue,
    rowId,
    columnId,
    dataType,
    onCommit: onCellUpdate,
  });

  const isNumber = dataType === "number";

  return (
    <div
      tabIndex={0}
      className="h-full w-full outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
      onDoubleClick={() => startEditing()}
      onKeyDown={onKeyDown}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          value={value}
          autoFocus
          inputMode={isNumber ? "numeric" : "text"}
          onChange={(e) => onChange(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            onInputKeyDown(e);
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
          className={`h-full w-full border-2 border-blue-500 bg-white px-3 text-[13px] outline-none ${
            isNumber ? "text-right" : ""
          }`}
        />
      ) : (
        <div
          className={`flex h-full w-full items-center px-3 text-[13px] ${
            isNumber ? "justify-end" : ""
          }`}
        >
          {value}
        </div>
      )}
    </div>
  );
}
