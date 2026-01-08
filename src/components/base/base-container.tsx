import type { Base } from "@/types/bases";
import BasesGridView from "./bases-grid-view";

interface Props {
  bases: Base[];
  viewMode: "grid" | "list";
}

export default function BaseContainer({ bases, viewMode }: Props) {
  return (
    <div className="flex w-full flex-1 flex-row">
      {/*  TITLE FOR ALL EXPECT "TODAY" */}
      {/* <div className="mb-6">
        <h2 className="text-sm">Today</h2>
      </div> */}

      {viewMode === "grid" && <BasesGridView bases={bases} />}
    </div>
  );
}
