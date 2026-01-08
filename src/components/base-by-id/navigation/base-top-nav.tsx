"use client";

import type { Base } from "@/types/bases";
import { TopNavBaseActions } from "../top-nav-base-actions";
import TopNavButtons from "../top-nav-buttons";
import TopNavTabs from "../top-nav-tabs";

interface props {
  base: Base;
}

{
  /* {isSaving && (
        <div className="flex flex-row gap-2">
          <LuLoaderPinwheel size={16} className="animate-spin" />
          <p className="text-xs text-gray-600">Saving...</p>
        </div>
      )} */
}

export function BaseTopNav({ base }: props) {
  return (
    <div className="shadow-b relative z-10 flex h-14 w-full items-center justify-between border-b border-gray-200 bg-white px-4 shadow-xs">
      {/* Left: base name, expandable name change dropdown */}
      <TopNavBaseActions base={base} />

      {/* middle tab section */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <TopNavTabs colour={base.color} />
      </div>

      {/* Right: help icon, bell icon, avatar */}
      <TopNavButtons colour={base.color} />
    </div>
  );
}
