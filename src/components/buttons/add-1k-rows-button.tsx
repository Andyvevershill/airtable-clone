import { useLoadingStore } from "@/app/stores/use-loading-store";
import { api } from "@/trpc/react";
import { toast } from "sonner";

interface Props {
  tableId: string;
}

export default function Add1kRowButton({ tableId }: Props) {
  const setIsLoading = useLoadingStore((state) => state.setIsLoading);

  const utils = api.useUtils();

  const addRow = api.row.addBulkRows.useMutation({
    onMutate: async ({ count }) => {
      setIsLoading(true);
      toast.warning(
        `Adding ${count.toLocaleString()} rows... This may take a little while.`,
      );

      // Cancel
      await utils.row.getRowCount.cancel({ tableId });

      // snapshot
      const previousCount = utils.row.getRowCount.getData({ tableId });

      // Optimistically update
      if (previousCount !== undefined) {
        utils.row.getRowCount.setData(
          { tableId },
          Number(previousCount) + Number(count),
        );
      }

      return { previousCount };
    },

    onError: (_error, _vars, context) => {
      // rollback
      if (context?.previousCount !== undefined) {
        utils.row.getRowCount.setData({ tableId }, context.previousCount);
      }

      void utils.row.getRowsInfinite.invalidate({ tableId });
      void utils.row.getRowCount.invalidate({ tableId });
    },

    onSuccess: () => {
      void utils.row.getRowsInfinite.invalidate({ tableId });
      void utils.row.getRowCount.invalidate({ tableId });
    },

    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleAddRow = () => {
    addRow.mutate({
      tableId,
      count: 1000,
    });
  };

  return (
    <button
      className="pointer flex w-full items-center justify-center rounded-xs border-1 bg-slate-50 p-2 text-[12px]"
      onClick={handleAddRow}
    >
      {addRow.isPending ? "Adding..." : "Add 1k rows"}
    </button>
  );
}
