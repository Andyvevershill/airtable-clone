"use client";

import { useSavingStore } from "@/app/stores/use-saving-store";
import { api } from "@/trpc/react";
import { useState } from "react";

interface Props {
  tableId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export function CreateViewForm({ tableId, onCancel, onSuccess }: Props) {
  const [viewName, setViewName] = useState("");
  const setIsSaving = useSavingStore((s) => s.setIsSaving);

  const createView = api.view.createView.useMutation({
    onMutate: () => {
      setIsSaving(true);
    },
    onSuccess: () => {
      setViewName("");
      onSuccess();
    },
    onSettled: () => {
      setIsSaving(false);
    },
  });

  const handleCreateView = () => {
    if (!viewName.trim()) return;
    createView.mutate({
      name: viewName,
      tableId: tableId,
    });
  };

  return (
    <div className="space-y-3 p-2">
      <input
        type="text"
        placeholder="View name"
        value={viewName}
        onChange={(e) => setViewName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleCreateView();
          }
        }}
        autoFocus
        className="w-full rounded border border-gray-300 px-1 py-1.5 text-[13px] focus:border-blue-500 focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          onClick={() => {
            setViewName("");
            onCancel();
          }}
          className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-[13px] hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleCreateView}
          disabled={!viewName.trim()}
          className="flex-1 rounded bg-blue-600 px-3 py-1.5 text-[13px] text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          Create view
        </button>
      </div>
    </div>
  );
}
