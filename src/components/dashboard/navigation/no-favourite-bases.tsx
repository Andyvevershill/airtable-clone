"use client";

import { CiStar } from "react-icons/ci";

export default function NoFavBaseButton() {
  return (
    <div className="relative mt-1.5 ml-2 flex h-[35px] w-[275px] flex-row gap-2">
      <div className="flex h-[30px] w-[40px] items-center justify-center rounded-sm border border-gray-200 bg-white">
        <CiStar size={16} />
      </div>

      <div className="relative ml-1.5 flex flex-col items-start justify-between">
        <p className="overflow-hidden text-[11px] text-gray-500">
          Your starred bases, interfaces, and workspaces will appear here
        </p>
      </div>
    </div>
  );
}
