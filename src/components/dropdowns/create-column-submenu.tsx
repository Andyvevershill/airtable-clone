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
    onMutate: async (newColumn) => {
      setIsSaving(true);

      await utils.column.getColumns.cancel({ tableId });

      const previousColumns = utils.column.getColumns.getData({ tableId });

      utils.column.getColumns.setData({ tableId }, (old) => {
        if (!old) return old;

        return [
          ...old,
          {
            id: newColumn.id,
            tableId,
            name: newColumn.name || "Untitled column",
            type: newColumn.type,
            position: old.length,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
      });

      return { previousColumns };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousColumns) {
        utils.column.getColumns.setData({ tableId }, context.previousColumns);
      }
      setIsSaving(false);
    },
    onSuccess: async () => {
      setIsSaving(false);
      setColumnName("");
    },
  });

  function handleCreateColumn() {
    const newColumn = {
      id: crypto.randomUUID(),
      tableId,
      type: selectedField,
      name: columnName || "Untitled column",
    };

    addColumn.mutate(newColumn);

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
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleCreateColumn();
              }
            }}
            placeholder="Field name (optional)"
            className="p-x-2 h-8 w-full rounded-sm border-gray-300 bg-white py-3 text-sm text-[13px] shadow-xs focus:ring-[#166ee1] focus-visible:ring-2"
            autoFocus
          />
        </div>
      </div>

      <MenubarSeparator className="my-3" />

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
          disabled={addColumn.isPending}
          className="pointer h-[32px] rounded-md bg-[#166ee1] px-3 py-1.5 text-xs text-white disabled:opacity-50"
        >
          {addColumn.isPending ? "Creating..." : "Create field"}
        </button>
      </div>
    </>
  );
}
