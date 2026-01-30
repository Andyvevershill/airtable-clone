"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Params {
  initialValue: string | null;
  rowId: string;
  columnId: string;
  dataType: string;
  onCommit: (
    rowId: string,
    columnId: string,
    value: string | null,
    onSettled: () => void,
  ) => void;
}

export function useEditableCell({
  initialValue,
  rowId,
  columnId,
  dataType,
  onCommit,
}: Params) {
  const [isEditing, setIsEditing] = useState(false);
  const [numberErrorCount, setNumberErrorCount] = useState(0);
  const [value, setValue] = useState(initialValue ?? "");
  const [checked, setChecked] = useState<boolean>(
    initialValue === "true" ? true : false,
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const shouldSelectRef = useRef(true);

  const isNumber = dataType === "number";
  const isCheckBox = dataType === "boolean";

  const isValidNumber = (v: string) => v === "" || /^-?\d*\.?\d*$/.test(v);

  const startEditing = (seed?: string) => {
    if (isCheckBox) {
      return;
    }
    if (seed !== undefined) {
      setValue(seed);
      shouldSelectRef.current = false;
    } else {
      shouldSelectRef.current = true;
    }
    setIsEditing(true);
  };

  // Auto-select text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      if (shouldSelectRef.current) {
        inputRef.current.select();
      } else {
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      }
    }
  }, [isEditing]);

  const commit = () => {
    if (isCheckBox) {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onCommit(rowId, columnId, !checked === true ? "true" : "false", () => {});
    }

    if (!isEditing) return;

    const next = value.trim() || null;

    if (isNumber && next !== null && !isValidNumber(next)) {
      setValue(initialValue ?? "");
      setIsEditing(false);
      return;
    }

    setIsEditing(false);

    // Only commit if the value actually changed
    if (next !== initialValue) {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onCommit(rowId, columnId, next, () => {});
    }
  };

  const cancel = () => {
    setValue(initialValue ?? "");
    setIsEditing(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) return;

    if (
      e.key === "CapsLock" ||
      e.key === "Shift" ||
      e.key === "Control" ||
      e.key === "Alt" ||
      e.key === "Meta"
    ) {
      return;
    }

    if (
      e.key === "Enter" ||
      e.key === "Tab" ||
      e.key === "Escape" ||
      e.key.startsWith("Arrow")
    ) {
      return;
    }

    if (e.key.length !== 1) return;
    if (isNumber && !isValidNumber(e.key)) {
      if (numberErrorCount < 5) {
        console.log(numberErrorCount);
        setNumberErrorCount((count) => count + 1);
        toast.error("Only numeric input is allowed in this cell.");
        return;
      } else {
        return;
      }
    }

    startEditing(e.key);
    e.preventDefault();
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isNumber) return;

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

  const onChange = (v: string) => {
    if (isNumber && !isValidNumber(v)) return;
    setValue(v);
  };

  return {
    isEditing,
    setChecked,
    checked,
    isCheckBox,
    inputRef,
    value,
    startEditing,
    commit,
    cancel,
    onKeyDown,
    onInputKeyDown,
    onChange,
  };
}
