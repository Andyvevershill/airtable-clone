import type { RowWithCells, TransformedRow } from "@/types";
import { faker } from "@faker-js/faker";
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

export function transformRowsToTanStackFormat(
  rows: RowWithCells[],
): TransformedRow[] {
  return rows.map((row) => {
    const transformedRow: TransformedRow = {
      _rowId: row.id,
      _cells: {},
      _cellMap: {},
    };

    if (!row.cells) return transformedRow;

    // Handle BOTH array and object shapes with proper typing
    const cellsArray: { id: string; columnId: string; value: string | null }[] =
      Array.isArray(row.cells) ? row.cells : Object.values(row.cells);

    for (const cell of cellsArray) {
      transformedRow._cells[cell.columnId] = cell.value;
      transformedRow._cellMap[cell.columnId] = cell.id;
    }

    return transformedRow;
  });
}

// {
//   notes: faker.lorem.sentence(),
//   status: faker.helpers.arrayElement(['active', 'pending', 'completed', 'cancelled'])
// }

// generates faker data depending on what the column type is (bulk action)
export function generateBulkFakerData(
  type: string,
  columnName: string,
  count: number,
) {
  const data: string[] = [];
  const lowerColumnName = columnName.toLowerCase();

  for (let i = 0; i < count; i++) {
    // Check column name first for special cases
    if (lowerColumnName === "notes") {
      data.push(faker.lorem.words({ min: 2, max: 3 }));
    } else if (lowerColumnName === "status") {
      data.push(
        faker.helpers.arrayElement([
          "active",
          "pending",
          "completed",
          "cancelled",
        ]),
      );
    } else {
      // Then fall back to type
      switch (type) {
        case "string":
          data.push(faker.person.firstName());
          break;
        case "number":
          data.push(faker.number.int({ max: 1000 }).toString());
          break;
        case "boolean":
          data.push(faker.datatype.boolean().toString());
          break;
        default:
          data.push("");
      }
    }
  }
  return data;
}

// generates faker data depending on what the column type is (single return)
export function returnFakerData(type: string, columnName: string) {
  let data = "";

  switch (type || columnName?.toLowerCase()) {
    case "string":
      data = faker.person.firstName();
      break;
    case "number":
      data = faker.number.int({ max: 1000 }).toString();
      break;
    case "boolean":
      data = faker.datatype.boolean().toString();
      break;
    case "notes":
      data = faker.lorem.sentence();
      break;
    case "status":
      data = faker.helpers.arrayElement([
        "active",
        "pending",
        "completed",
        "cancelled",
      ]);
      break;
    default:
      data = "string";
  }

  return data;
}

export function showNotFunctionalToast() {
  toast.warning("This feature is not functional in the demo app");
}
