import type { RowWithCells, TransformedRow } from "@/types";
import { clsx, type ClassValue } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DEFAULT_BASE_CONFIG = {
  name: "Untitled Base",
  colours: [
    "#B91C1C",
    "#1D4ED8",
    "#6D28D9",
    "#15803D",
    "#1F2937",
    "#9A3412",
    "#7C2D12",
    "#0F766E",
    "#065F46",
    "#3730A3",
    "#4A044E",
  ],
  columns: [
    { name: "Name", position: 0, type: "string" },
    { name: "Notes", position: 1, type: "string" },
    { name: "Assignee", position: 2, type: "string" },
    { name: "Status", position: 3, type: "string" },
    { name: "Number", position: 6, type: "number" },
    { name: "Done", position: 7, type: "boolean" },
  ],
  defaultTableName: "Table 1",
  defaultRowCount: 3,
} as const;

export function getRandomColour(): string {
  const colours = DEFAULT_BASE_CONFIG.colours;
  return colours[Math.floor(Math.random() * colours.length)] ?? "#6D28D9";
}

export function getLastAccessed(lastAccessed: Date): string {
  const now = new Date();
  const minutesAgo = Math.floor(
    (now.getTime() - lastAccessed.getTime()) / 60000,
  );
  const hoursAgo = Math.floor(minutesAgo / 60);
  const daysAgo = Math.floor(hoursAgo / 24);
  const weeksAgo = Math.floor(daysAgo / 7);

  if (minutesAgo < 2) {
    return "just now";
  }
  if (minutesAgo < 60) {
    return `${minutesAgo} minutes ago`;
  }
  if (hoursAgo < 24) {
    return `${hoursAgo} hours ago`;
  }
  if (daysAgo < 7) {
    return `${daysAgo} days ago`;
  }
  if (weeksAgo < 52) {
    return `${weeksAgo} weeks ago`;
  }

  return "more than a year ago";
}

export function lightenColour(hexColor: string, opacity = 0.2) {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Brighten the color slightly
  const brightenedR = Math.min(255, Math.round(r * 1.8));
  const brightenedG = Math.min(255, Math.round(g * 1.8));
  const brightenedB = Math.min(255, Math.round(b * 1.8));

  return `rgba(${brightenedR}, ${brightenedG}, ${brightenedB}, ${opacity})`;
}

export function darkenColour(hexColor: string, opacity = 0.12) {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity * 0.25})`;
}

// startIndex = where this page sits in the whole table, so the row knows its real index
export function transformRowsToTanStackFormat(
  rows: RowWithCells[],
  startIndex = 0,
): TransformedRow[] {
  return rows.map((row, i) => {
    const transformedRow: TransformedRow = {
      _rowId: row.id,
      _index: startIndex + i,
      _cells: {},
    };

    for (const cell of row.cells) {
      transformedRow._cells[cell.columnId] = cell.value;
    }

    return transformedRow;
  });
}

export function showNotFunctionalToast() {
  toast.warning("This feature is not functional in the demo app");
}
