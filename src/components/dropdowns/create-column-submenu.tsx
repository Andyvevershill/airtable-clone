"use client";

import { useSavingStore } from "@/app/stores/use-saving-store";
import { MenubarSeparator } from "@/components/ui/menubar";
import { api } from "@/trpc/react";
import { useState } from "react";
import { CgProfile } from "react-icons/cg";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface Props {
  tableId: string;
  selectedField: string;
  handleResetAll: () => void;
}

export function CreateColumnSubmenu({
  tableId,
  handleResetAll,
  selectedField,
}: Props) {
  const [columnName, setColumnName] = useState("");

  const setIsSaving = useSavingStore((state) => state.setIsSaving);

  const utils = api.useUtils();

  const addColumn = api.column.addColumn.useMutation({
    onMutate: () => {
      setIsSaving(true);
    },
    onSuccess: () => {
      // Invalidate columns query to refetch
      void utils.column.getColumns.invalidate({ tableId });

      // Invalidate rows query to get cells for new column
      void utils.row.getRowsInfinite.invalidate({ tableId });
    },
    onError: (error) => {
      console.error("Failed to add column:", error);
    },
    onSettled: () => {
      setIsSaving(false);
    },
  });

  function handleCreateColumn() {
    console.log("Creating column:", {
      tableId,
      dataType: selectedField,
      columnName: columnName ?? "Untitled column",
    });

    addColumn.mutate({
      tableId,
      type: selectedField,
      name: columnName,
    });

    setColumnName("");
    handleResetAll();
  }

  return (
    <>
      <div onClick={(e) => e.stopPropagation()} className="flex flex-col gap-1">
        <div className="flex flex-row items-center justify-between gap-2">
          <Button variant="outline" className="pointer h-8 w-8">
            <CgProfile />
          </Button>
          <Input
            type="text"
            value={columnName}
            onChange={(e) => setColumnName(e.target.value)}
            placeholder="Field name (optional)"
            className="p-x-2 h-8 w-full rounded-sm border-gray-300 bg-white py-3 text-sm text-[13px] shadow-xs focus:ring-[#166ee1] focus-visible:ring-2"
            autoFocus
          />
        </div>
      </div>

      <MenubarSeparator className="my-3" />

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleResetAll();
          }}
          className="pointer h-[32px] rounded-md px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCreateColumn();
          }}
          className="pointer h-[32px] rounded-md bg-[#166ee1] px-3 py-1.5 text-xs text-white"
        >
          Create field
        </button>
      </div>
    </>
  );
}
