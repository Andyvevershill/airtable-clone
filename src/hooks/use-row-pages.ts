"use client";

import { PAGE_SIZE } from "@/lib/constants";
import { transformRowsToTanStackFormat } from "@/lib/utils";
import { api } from "@/trpc/react";
import type { TransformedRow } from "@/types";
import type { QueryParams } from "@/types/view";
import { useCallback, useMemo, useRef, useState } from "react";

// loads the table in pages of 500, but any page can be loaded straight away
// e.g. dragging the scrollbar to row 80,000 loads page 160 without loading 1-159 first
export function useRowPages(queryParams: QueryParams, enabled: boolean) {
  const paramsKey = JSON.stringify(queryParams);

  const [requested, setRequested] = useState({ key: paramsKey, pages: [0] });

  // new sort/filter = forget the old pages, the table asks for what's on screen again
  const pages = requested.key === paramsKey ? requested.pages : [0];

  const results = api.useQueries((t) =>
    pages.map((page) =>
      t.row.getRows(
        { ...queryParams, page },
        { enabled, refetchOnWindowFocus: false },
      ),
    ),
  );

  const loadRows = useCallback(
    (startIndex: number, endIndex: number) => {
      const firstPage = Math.floor(startIndex / PAGE_SIZE);
      const lastPage = Math.floor(endIndex / PAGE_SIZE);

      setRequested((prev) => {
        const current = prev.key === paramsKey ? prev.pages : [0];
        const missing: number[] = [];

        for (let page = firstPage; page <= lastPage; page++) {
          if (!current.includes(page)) missing.push(page);
        }

        if (prev.key === paramsKey && missing.length === 0) return prev;

        return { key: paramsKey, pages: [...current, ...missing] };
      });
    },
    [paramsKey],
  );

  // keep showing the last rows while a new sort/filter loads (same as placeholderData before)
  const lastLoaded = useRef<{
    rows: TransformedRow[];
    totalFilteredCount?: number;
    loadedOnce: boolean;
  }>({ rows: [], loadedOnce: false });

  // only rebuild the rows when a page actually changes, not on every render
  const dataKey = results.map((r) => r.dataUpdatedAt).join(",");

  const loaded = useMemo(() => {
    const firstPage = results[0]?.data;
    if (!firstPage) return lastLoaded.current;

    const rows: TransformedRow[] = [];
    results.forEach((result, i) => {
      if (!result.data) return;
      rows.push(
        ...transformRowsToTanStackFormat(
          result.data.items,
          pages[i]! * PAGE_SIZE,
        ),
      );
    });

    lastLoaded.current = {
      rows,
      totalFilteredCount: firstPage.totalFilteredCount,
      loadedOnce: true,
    };
    return lastLoaded.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey]);

  return {
    rows: loaded.rows,
    totalFilteredCount: loaded.totalFilteredCount,
    loadRows,
    isLoading: !loaded.loadedOnce,
    isFetching: results.some((r) => r.isFetching),
    isFetchingFirstPage: !!results[0]?.isFetching,
    isFetchingMore: results.some((r, i) => i > 0 && r.isFetching),
  };
}
