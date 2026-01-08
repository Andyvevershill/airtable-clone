import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DEFAULT_BASE_CONFIG = {
  name: "Untitled Base",
  colors: ["#B91C1C", "#1D4ED8", "#6D28D9", "#15803D", "#1F2937"],
  columns: [
    { name: "Name", type: "text", position: 0 },
    { name: "Notes", type: "text", position: 1 },
    { name: "Assignee", type: "text", position: 2 },
    { name: "Status", type: "text", position: 3 },
    { name: "Attachments", type: "text", position: 4 },
    { name: "Attachment Summary", type: "text", position: 5 },
  ],
  defaultTableName: "Table 1",
  defaultRowCount: 3,
} as const;

export function getRandomColor(): string {
  const colors = DEFAULT_BASE_CONFIG.colors;
  return colors[Math.floor(Math.random() * colors.length)] ?? "#6D28D9";
}

export function getLastAccessed(lastAccessed: Date): string {
  const now = new Date();
  const minutesAgo = Math.floor(
    (now.getTime() - lastAccessed.getTime()) / 60000,
  );
  const hoursAgo = Math.floor(minutesAgo / 60);
  const daysAgo = Math.floor(hoursAgo / 24);
  const weeksAgo = Math.floor(daysAgo / 7);

  if (minutesAgo < 5) {
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
