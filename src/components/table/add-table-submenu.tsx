"use client";

import { useSavingStore } from "@/app/stores/use-saving-store";
import {
  MenubarItem,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
} from "@/components/ui/menubar";
import { api } from "@/trpc/react";
import { createId } from "@paralleldrive/cuid2";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  baseId: string;
  tableNumber: number;
  setTables: React.Dispatch<
    React.SetStateAction<{ id: string; name: string }[]>
  >;
  onTableCreated?: () => void;
}

export function AddTableSubmenu({
  baseId,
  tableNumber,
  setTables,
  onTableCreated,
}: Props) {
  const setIsSaving = useSavingStore((state) => state.setIsSaving);
  const router = useRouter();

  const utils = api.useUtils();

  const tableId = createId();

  const createTable = api.table.createById.useMutation({
    onMutate: () => {
      setIsSaving(true);
    },
    onSuccess: () => {
      void utils.base.getById.invalidate({ id: baseId });
    },
    onSettled: () => {
      setIsSaving(false);
    },
  });

  async function handleTableCreation() {
    setTables((prev) => [
      ...prev,
      { id: tableId, name: `Table ${tableNumber}` },
    ]);

    const res = await createTable.mutateAsync({
      baseId,
      tableId,
      tableNumber,
    });

    // Close the parent menu
    void onTableCreated?.();

    router.push(`/base/${baseId}/${res.table.id}`);
  }

  return (
    <MenubarSub>
      <MenubarSubTrigger className="flex w-full flex-row items-center gap-2 rounded-sm px-2 py-1.5 text-gray-600 hover:text-gray-900">
        <Plus size={16} />
        <p className="text-sm">Add table</p>
      </MenubarSubTrigger>

      <MenubarSubContent className="rounded-xs p-2 text-sm md:w-75">
        <p className="mb-1 ml-3 items-center text-xs text-gray-400">
          Add a blank table
        </p>
        <MenubarItem
          className="pointer flex cursor-pointer flex-col items-start gap-0.5 rounded-sm px-3 py-2 hover:bg-gray-100"
          onClick={handleTableCreation}
        >
          <p className="text-sm font-medium text-gray-900">
            Start from scratch
          </p>
        </MenubarItem>
      </MenubarSubContent>
    </MenubarSub>
  );
}
