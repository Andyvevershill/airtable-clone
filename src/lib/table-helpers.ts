"use client";

import type { GlobalSearchMatches } from "@/types/view";
import { useLayoutEffect, useState, type RefObject } from "react";

// CHAPTER 3: SEARCH MATCH UTILITIES
export function createMatchedColumnSet(
  matches: GlobalSearchMatches["matches"],
) {
  const set = new Set<string>();
  for (const match of matches) {
    if (match.type === "column") {
      set.add(match.columnId);
    }
  }
  return set;
}

export function createMatchedCellSet(matches: GlobalSearchMatches["matches"]) {
  const set = new Set<string>();
  for (const match of matches) {
    if (match.type === "cell") {
      set.add(match.cellId);
    }
  }
  return set;
}

// CHAPTER 7: CUSTOM HOOKS
export function useTableWidth(tableRef: RefObject<HTMLTableElement>) {
  const [tableWidth, setTableWidth] = useState(0);

  useLayoutEffect(() => {
    if (!tableRef.current) return;

    const update = () => setTableWidth(tableRef.current!.offsetWidth);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(tableRef.current);

    return () => observer.disconnect();
  }, [tableRef]);

  return tableWidth;
}
