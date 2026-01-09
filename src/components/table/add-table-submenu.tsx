"use client";

import { useSavingStore } from "@/app/stores/use-saving-store";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { api } from "@/trpc/react";
import { createId } from "@paralleldrive/cuid2";
import { ArrowRight, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  baseId: string;
  tableNumber: number;
  setTables: React.Dispatch<
    React.SetStateAction<{ id: string; name: string }[]>
  >;
}

export function AddTableSubmenu({ baseId, tableNumber, setTables }: Props) {
  const setIsSaving = useSavingStore((state) => state.setIsSaving);
  const router = useRouter();

  const tableId = createId();

  const createTable = api.table.createById.useMutation({
    onMutate: () => {
      setIsSaving(true);
    },
    onSuccess: () => {
      router.refresh();
    },

    onSettled: () => {
      setIsSaving(false);
    },
  });

  async function handleTableCreation() {
    // lets just create the ID here, so we can imedidietly update state?
    // lets not even wait for them to click, lets create an ID as soon as they enter here in global
    setTables((prev) => [
      ...prev,
      { id: tableId, name: `Table ${tableNumber}` },
    ]);
    const res = await createTable.mutateAsync({
      baseId,
      tableId,
      tableNumber,
    });

    router.push(`/base/${baseId}/${res.table.id}`);
  }

  return (
    <Menubar className="border-0 bg-transparent p-0">
      <MenubarMenu>
        <MenubarTrigger className="pointer flex w-full flex-row items-center justify-between rounded-sm px-2 py-1.5 text-gray-600 hover:text-gray-900">
          <div className="flex flex-row items-center gap-2">
            <Plus size={16} />
            <p className="text-sm">Add table</p>
          </div>
          <ArrowRight size={16} />
        </MenubarTrigger>

        <MenubarContent
          className="ml-1 rounded-xs p-2 text-sm md:w-75"
          side="right"
          align="start"
          sideOffset={0}
        >
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
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
