import { useLoadingStore } from "@/app/stores/use-loading-store";
import { api } from "@/trpc/react";
import { Button } from "../ui/button";

interface Props {
  tableId: string;
}

export default function Add100kRowButton({ tableId }: Props) {
  const setIsLoading = useLoadingStore((state) => state.setIsLoading);

  const utils = api.useUtils();

  const addRow = api.row.addBulkRows.useMutation({
    onMutate: () => {
      setIsLoading(true);
    },
    onSuccess: () => {
      // Invalidate columns query to refetch
      void utils.column.getColumns.invalidate({ tableId });

      // Invalidate rows query to get cells for new column
      void utils.row.getRowsInfinite.invalidate({ tableId });

      // invadlide row count
      void utils.row.getRowCount.invalidate({ tableId });
    },
    onError: (error) => {
      console.error("Failed to add column:", error);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleAddRow = () => {
    addRow.mutate({
      tableId,
      count: 100000,
    });
  };

  return (
    <Button
      className="pointer flex items-center justify-center text-[13px]"
      variant="outline"
      title="Add 100k rows"
      onClick={handleAddRow}
    >
      Add 100k rows
    </Button>
  );
}
