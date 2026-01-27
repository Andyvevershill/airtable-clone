"use client";

import BaseContainer from "@/components/base/base-container";
import DateRangeDropdownSelector from "@/components/dropdowns/date-range-dropdown-selector";
import type { typeBaseWithTableIds } from "@/types";
import { useState } from "react";
import SelectView from "./select-view";

interface Props {
  bases: typeBaseWithTableIds[];
}

export default function DashboardContainer({ bases }: Props) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <main className="flex h-full flex-col items-start justify-items-start bg-gray-50 px-12 py-8 text-[#1d1f25]">
      {/* TITLE  */}
      <div className="mb-6">
        <h1 className="text-[28px] font-semibold">Home</h1>
      </div>
      {/* DROPDOWN AND CHANGE VIEW BUTTONS */}
      <div className="mb-5 flex w-full flex-row items-start justify-between">
        <DateRangeDropdownSelector />
        <SelectView viewMode={viewMode} setViewMode={setViewMode} />
      </div>
      {/* SECTIONS BY LAST VIEWED */}

      <BaseContainer bases={bases} viewMode={viewMode} />
    </main>
  );
}
