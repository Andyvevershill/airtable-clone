import { BULK_ROWS_OWNER_EMAIL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useLoadingStore } from "@/stores/use-loading-store";
import { api } from "@/trpc/react";
import type { User } from "@/types";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface Props {
  tableId: string;
  user: User;
}

export default function Add100kRowButton({ tableId, user }: Props) {
  const setIsLoading = useLoadingStore((state) => state.setIsLoading);

  const utils = api.useUtils();

  const addRow = api.row.addBulkRows.useMutation({
    onMutate: async ({ count }) => {
      setIsLoading(true);
      toast.warning(
        `Adding ${count.toLocaleString()} rows... This may take a few moments`,
      );

      // Cancel ongoing queries
      await utils.row.getRowCount.cancel({ tableId });

      // Get current count
      const previousCount = utils.row.getRowCount.getData({ tableId });

      // Optimistically update count
      if (previousCount !== undefined) {
        utils.row.getRowCount.setData(
          { tableId },
          Number(previousCount) + Number(count),
        );
      }

      return { previousCount };
    },

    onError: (_error, _vars, context) => {
      if (context?.previousCount !== undefined) {
        utils.row.getRowCount.setData({ tableId }, context.previousCount);
      }

      // incase we have created x rows before the error happened, we need to invalidate the cache to see the new ones!
      void utils.row.getRows.invalidate({ tableId });
      void utils.row.getRowCount.invalidate({ tableId });
    },

    onSuccess: () => {
      void utils.row.getRows.invalidate({ tableId });
      void utils.row.getRowCount.invalidate({ tableId });
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

  const shouldDisable = user.email !== BULK_ROWS_OWNER_EMAIL;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center justify-center rounded-xs border-1 bg-slate-50 p-2 text-[12px]",
            shouldDisable ? "cursor-not-allowed" : "pointer",
          )}
          disabled={addRow.isPending || shouldDisable}
          onClick={handleAddRow}
        >
          {addRow.isPending ? "Adding..." : "Add 100k rows"}
        </button>
      </TooltipTrigger>
      {shouldDisable && (
        <TooltipContent side="bottom" align="center">
          {shouldDisable &&
            `Sorry ${user.name.split(" ")[0]}, only the creator can add 100k rows at a time`}
        </TooltipContent>
      )}
    </Tooltip>
  );
}
