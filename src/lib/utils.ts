import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DEFAULT_BASE_CONFIG = {
  name: "Untitled Base",
  colours: ["#B91C1C", "#1D4ED8", "#6D28D9", "#15803D", "#1F2937"],
  columns: [
    { name: "Name", position: 0 },
    { name: "Notes", position: 1 },
    { name: "Assignee", position: 2 },
    { name: "Status", position: 3 },
    { name: "Attachments", position: 4 },
    { name: "Attachment Summary", position: 5 },
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

export function lightenColour(hexColor: string, opacity = 0.1) {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function darkenColour(hexColor: string, opacity = 0.12) {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity * 0.25})`;
}
