import { cn } from "@/lib/utils";
import type { TransformedRow } from "@/types/row";
import type { GlobalSearchMatches } from "@/types/view";
import { flexRender, type Header, type Table } from "@tanstack/react-table";

const TABLE_CONFIG = {
  MIN_COL_WIDTH: 175,
  ROW_HEIGHT: 32,
  GUTTER_WIDTH: 70,
} as const;

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
  // CHECK IF COLUMN HEADER IS MATCHES SEARCH RESULT
  const isColumnActive = (columnId: string): boolean => {
    return activeMatch?.type === "column" && activeMatch.columnId === columnId;
  };

  // UI FEEDBACK FOR FILTERS/SORTING/SEARCH RESULTS
  const getColumnHeaderClasses = (
    header: Header<TransformedRow, unknown>,
    index: number,
    isActive: boolean,
  ): string => {
    return cn(
      "relative overflow-hidden border-r border-gray-200 bg-white px-3 py-2 text-left text-[13px] font-medium text-gray-700 shadow-[inset_0_-1px_0_0_rgb(229,231,235)] hover:bg-gray-50",
      header.column.getIsFiltered() && "bg-[#F6FBF7]",
      index === 0 && "border-l-0",
      header.column.getIsSorted() &&
        !header.column.getIsFiltered() &&
        "bg-[#FAF5F2]",
      matchedColumnIdSet.has(header.id) && "bg-[#FFF3D3]",
      isActive && "bg-[#f1cf6b]",
    );
  };

  return (
    <thead className="sticky top-0 z-20 bg-white">
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {/* Fake Header (Row Numbers Column) */}
          <th
            className="bg-white shadow-[inset_0_-1px_0_0_rgb(229,231,235)]"
            style={{
              width: TABLE_CONFIG.GUTTER_WIDTH,
              minWidth: TABLE_CONFIG.GUTTER_WIDTH,
              height: TABLE_CONFIG.ROW_HEIGHT,
            }}
          />

          {/* Data Column Headers */}
          {headerGroup.headers.map((header, index) => {
            const isActive = isColumnActive(header.id);

            return (
              <th
                key={header.id}
                data-column-id={header.id}
                className={getColumnHeaderClasses(header, index, isActive)}
                style={{
                  minWidth: TABLE_CONFIG.MIN_COL_WIDTH,
                  width: header.getSize(),
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
