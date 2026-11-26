import { useLoadingStore } from "@/stores/use-loading-store";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface Props {
  tableId: string;
  rowCount: number;
}

export default function Add1kRowButton({ tableId, rowCount }: Props) {
  const setIsLoading = useLoadingStore((state) => state.setIsLoading);

  const limitReached = rowCount >= 5000;

  const utils = api.useUtils();

  const addRow = api.row.addBulkRows.useMutation({
    onMutate: async ({ count }) => {
      setIsLoading(true);
      toast.warning(
        `Adding ${count.toLocaleString()} rows of fake data. This may take a moment...`,
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

      void utils.row.getRows.invalidate({ tableId });
      void utils.row.getRowCount.invalidate({ tableId });
    },

    onSuccess: async () => {
      // Update count first
      await utils.row.getRowCount.invalidate({ tableId });

      // tried everything to avoid invalidating the whole list but tRPC makes it hard
      // triggering a fetch next row here bugged the current fetch next call, especially when we add single rows quickly after
      await utils.row.getRows.invalidate({ tableId });
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

  console.log(tableId);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className="pointer flex w-full items-center justify-center rounded-xs border-1 bg-slate-50 p-2 text-[12px]"
          onClick={handleAddRow}
          disabled={addRow.isPending || limitReached}
        >
          {addRow.isPending
            ? "Adding..."
            : limitReached
              ? "Limit reached"
              : "Add 1k rows"}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="center">
        {limitReached
          ? "You have reached the maximum of 5,000 rows for this table."
          : "Add 1,000 rows to the table."}
      </TooltipContent>
    </Tooltip>
  );
}
