import type { typeBaseWithTableIds } from "@/types/base";
import BasesGridView from "./bases-grid-view";

interface Props {
  bases: typeBaseWithTableIds[];
  viewMode: "grid" | "list";
}

export default function BaseContainer({ bases, viewMode }: Props) {
  return (
    <div className="flex w-full flex-1 flex-row items-start">
      {viewMode === "grid" ? (
        <BasesGridView bases={bases} />
      ) : (
        <div className="position-center h-full w-full items-center">
          <p className="text-md text-gray-500">List view is coming soon!</p>
        </div>
      )}
    </div>
  );
}
