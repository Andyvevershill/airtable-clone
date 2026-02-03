"use client";

import { useSavingStore } from "@/app/stores/use-saving-store";
import type { View } from "@/server/db/schemas";
import { api } from "@/trpc/react";
import { useState } from "react";
import { Input } from "../ui/input";

interface Props {
  view: View;
  setViews: React.Dispatch<React.SetStateAction<View[]>>;
  onDone: () => void;
}

export default function ViewEditMode({ view, setViews, onDone }: Props) {
  const setIsSaving = useSavingStore((s) => s.setIsSaving);
  const [newName, setNewName] = useState(view.name);

  const renameView = api.view.updateName.useMutation({
    onMutate: ({ name }) => {
      setIsSaving(true);
      setViews((prev) =>
        prev.map((v) => (v.id === view.id ? { ...v, name } : v)),
      );
    },
    onError: () => {
      setViews((prev) => prev.map((v) => (v.id === view.id ? view : v)));
      setIsSaving(false);
    },
    onSettled: () => setIsSaving(false),
  });

  const save = () => {
    if (newName.trim() && newName !== view.name) {
      renameView.mutate({ id: view.id, name: newName.trim() });
    }
    onDone();
  };

  return (
    <Input
      autoFocus
      value={newName}
      onChange={(e) => setNewName(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && save()}
      onBlur={save}
      onClick={(e) => e.stopPropagation()}
      className="border-grey-300 h-7 w-full rounded-xs border-2 bg-white text-sm"
    />
  );
}
