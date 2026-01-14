"use client";

import { useEffect, useRef, useState } from "react";

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

  const initialRef = useRef<string | null>(initialValue ?? "");
  const liveRef = useRef<string | null>(initialRef.current);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasPendingCommit = useRef(false);

  const isNumber = dataType === "number";

  /* ---------------- sync external updates safely ---------------- */

  useEffect(() => {
    if (isEditing) return;
    if (hasPendingCommit.current) return;

    initialRef.current = initialValue ?? "";
    liveRef.current = initialValue ?? "";
  }, [initialValue, isEditing]);

  /* ---------------- helpers ---------------- */

  const isValidNumber = (v: string) => v === "" || /^-?\d*\.?\d*$/.test(v);

  /* ---------------- editing lifecycle ---------------- */

  const startEditing = (seed?: string) => {
    setIsEditing(true);

    requestAnimationFrame(() => {
      if (!inputRef.current) return;

      if (seed !== undefined) {
        inputRef.current.value = seed;
        liveRef.current = seed;
      }

      inputRef.current.focus();
      inputRef.current.select();
    });
  };

  const commit = () => {
    if (!isEditing) return;

    const next = liveRef.current?.trim() ?? null;

    // numeric hard guard
    if (isNumber && next !== null && !isValidNumber(next)) {
      // reject commit → revert
      liveRef.current = initialRef.current;
      setIsEditing(false);
      return;
    }

    if (next !== initialRef.current) {
      hasPendingCommit.current = true;

      onCommit(rowId, columnId, next, () => {
        hasPendingCommit.current = false;
      });

      initialRef.current = next;
    }

    setIsEditing(false);
  };

  const cancel = () => {
    liveRef.current = initialRef.current;
    setIsEditing(false);
  };

  /* ---------------- keyboard handling (single source of truth) ---------------- */

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) return;

    // ignore modifier/system keys
    if (
      e.key === "CapsLock" ||
      e.key === "Shift" ||
      e.key === "Control" ||
      e.key === "Alt" ||
      e.key === "Meta"
    ) {
      return;
    }

    // navigation keys
    if (
      e.key === "Enter" ||
      e.key === "Tab" ||
      e.key === "Escape" ||
      e.key.startsWith("Arrow")
    ) {
      return;
    }

    // must be printable
    if (e.key.length !== 1) return;

    // numeric guard at entry
    if (isNumber && !isValidNumber(e.key)) return;

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

  /* ---------------- input change ---------------- */

  const onChange = (v: string) => {
    if (isNumber && !isValidNumber(v)) return;
    liveRef.current = v;
  };

  return {
    isEditing,
    inputRef,
    startEditing,
    commit,
    cancel,
    onKeyDown,
    onInputKeyDown,
    onChange,
    displayValue: initialRef.current,
  };
}
