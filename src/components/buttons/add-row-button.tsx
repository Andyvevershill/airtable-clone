import { useLoadingStore } from "@/app/stores/use-loading-store";
import { api } from "@/trpc/react";
import { AiOutlinePlus } from "react-icons/ai";

interface Props {
  tableId: string;
}

export default function AddRowButton({ tableId }: Props) {
  const setIsLoading = useLoadingStore((state) => state.setIsLoading);

  const utils = api.useUtils();

  const addRow = api.row.addRow.useMutation({
    onMutate: () => {
      setIsLoading(true);
    },
    onSuccess: () => {
      // Invalidate columns query to refetch
      void utils.column.getTableColumns.invalidate({ tableId });

      // Invalidate rows query to get cells for new column
      void utils.row.getRowsInfinite.invalidate({ tableId });
    },
    onError: (error) => {
      console.error("Failed to add column:", error);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleAddRow = () => {
    // do we need to do anything in here with the rows??
    // should we pass the
    console.log("created new row!");
    addRow.mutate({
      tableId,
    });
  };

  return (
    <button
      className="pointer flex h-8 w-8 items-center justify-center"
      title="Add column"
      onClick={handleAddRow}
    >
      <AiOutlinePlus size={16} className="text-gray-600" />
    </button>
  );
}
