import { useLoadingStore } from "@/app/stores/use-loading-store";
import { api } from "@/trpc/react";
import { AiOutlinePlus } from "react-icons/ai";

interface Props {
  tableId: string;
}

export default function AddColumnButton({ tableId }: Props) {
  const setIsLoading = useLoadingStore((state) => state.setIsLoading);

  const utils = api.useUtils();

  const addColumn = api.column.addColumn.useMutation({
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

  const handleAddColumn = () => {
    // do we need to do anything in here with the rows??
    // should we pass the
    console.log("created new col");
    addColumn.mutate({
      tableId,
      type: "number",
      name: "test col!",
    });
  };

  return (
    <div className="sticky top-0 flex h-full items-center justify-center">
      <button
        className="pointer flex h-8 w-8 items-center justify-center"
        title="Add column"
        onClick={handleAddColumn}
      >
        <AiOutlinePlus size={16} className="text-gray-600" />
      </button>
    </div>
  );
}
