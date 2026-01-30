"use client";

import { useLoadingStore } from "@/app/stores/use-loading-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import Add1kRowButton from "../buttons/add-1k-rows-button";

interface Props {
  tableId: string;
}

export default function Add1kRowDialog({ tableId }: Props) {
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
    <Dialog>
      <DialogTrigger asChild>
        <Add1kRowButton tableId={tableId} />
      </DialogTrigger>
      <DialogContent className="h-115 w-188">
        <DialogHeader>
          <DialogTitle className="mb-2 text-2xl">
            Do you want to create 1,000 rows with fake data?
          </DialogTitle>
          <div className="m-0 border-t border-gray-200 p-0" />
        </DialogHeader>
        <div className="flex-grid flex gap-2 p-4">
          <div className="IC mt-1.5 hidden h-220 w-340 cursor-pointer opacity-50 transition-transform duration-300 ease-out hover:scale-101 lg:flex">
            testing here
          </div>
          <div className="IC hidden h-220 w-340 cursor-pointer transition-transform duration-300 ease-out hover:scale-101 lg:flex">
            and testing here too
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
