import { useSavingStore } from "@/app/stores/use-saving-store";
import { api } from "@/trpc/react";
import { RiDeleteBinLine } from "react-icons/ri";

interface Props {
  columnId: string;
}

export default function DeleteColumnButton({ columnId }: Props) {
  const setIsSaving = useSavingStore((state) => state.setIsSaving);
  const utils = api.useUtils();

  const deleteColumn = api.column.deleteColumn.useMutation({
    onMutate: async () => {
      setIsSaving(true);
    },
    onError: (error) => {
      console.error("Failed to delete column:", error);
      setIsSaving(false);
    },
    onSuccess: (data) => {
      void utils.column.getColumns.invalidate({ tableId: data.tableId });
      void utils.row.getRowsInfinite.invalidate({ tableId: data.tableId });
      setIsSaving(false);
    },
  });

  const handleDeleteColumn = () => {
    deleteColumn.mutate({ columnId });
  };

  return (
    <div
      className="pointer flex h-full w-full cursor-pointer flex-row items-center rounded text-[13px]"
      onClick={handleDeleteColumn}
    >
      <RiDeleteBinLine className="text-muted-foreground/70 mr-4 h-3.5 w-3.5" />
      <p className="text-[#b10f41]">Delete field</p>
    </div>
  );
}
