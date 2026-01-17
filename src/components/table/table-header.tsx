import { cn } from "@/lib/utils";
import type { TransformedRow } from "@/types/row";
import type { GlobalSearchMatches } from "@/types/view";
import { flexRender, type Table } from "@tanstack/react-table";

const MIN_COL_WIDTH = 175;
const ROW_HEIGHT = 32;
const GUTTER_WIDTH = 70;

interface TableHeaderProps {
  table: Table<TransformedRow>;
  activeMatch: GlobalSearchMatches["matches"][number] | undefined;
  matchedColumnIdSet: Set<string>;
}

export function TableHeader({
  table,
  activeMatch,
  matchedColumnIdSet,
}: TableHeaderProps) {
  return (
    <thead className="sticky top-0 z-20 bg-white">
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {/* FAKE GUTTER HEADER */}
          <th
            className={
              "bg-white text-gray-600 shadow-[inset_0_-1px_0_0_rgb(229,231,235)]"
            }
            style={{
              width: GUTTER_WIDTH,
              minWidth: GUTTER_WIDTH,
              height: ROW_HEIGHT,
            }}
          />

          {headerGroup.headers.map((header, index) => {
            const isActiveColumn =
              activeMatch?.type === "column" &&
              activeMatch.columnId === header.id;

            return (
              <th
                key={header.id}
                data-column-id={header.id}
                className={cn(
                  "relative overflow-hidden border-r border-gray-200 bg-white px-3 text-left text-[13px] font-medium text-gray-700 shadow-[inset_0_-1px_0_0_rgb(229,231,235)] hover:bg-gray-50",
                  header.column.getIsFiltered() && "bg-[#F6FBF7]",
                  index === 0 && "border-l-0",
                  header.column.getIsSorted() &&
                    !header.column.getIsFiltered() &&
                    "bg-[#FAF5F2]",
                  matchedColumnIdSet.has(header.id) && "bg-[#FFF3D3]",
                  isActiveColumn && "bg-[#f1cf6b]",
                )}
                style={{
                  minWidth: MIN_COL_WIDTH,
                  width: header.getSize(),
                  position: "relative",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext(),
                )}
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
  );
}
