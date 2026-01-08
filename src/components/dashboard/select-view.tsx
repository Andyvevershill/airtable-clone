"use client";

import { LuGrid2X2 } from "react-icons/lu";
import { RxHamburgerMenu } from "react-icons/rx";

interface viewMode {
  viewMode: "grid" | "list";
  setViewMode: (viewMode: "grid" | "list") => void;
}

export default function ({ viewMode, setViewMode }: viewMode) {
  return (
    <div className="flex flex-row gap-1 text-gray-700">
      <button
        onClick={() => setViewMode("list")}
        className={`pointer flex h-7 w-7 items-center justify-center rounded-full ${
          viewMode === "list" ? "bg-gray-200" : "bg-transparent"
        }`}
      >
        <RxHamburgerMenu />
      </button>

      <button
        onClick={() => setViewMode("grid")}
        className={`pointer flex h-7 w-7 items-center justify-center rounded-full ${
          viewMode === "grid" ? "bg-gray-200" : "bg-transparent"
        }`}
      >
        <LuGrid2X2 />
      </button>
    </div>
  );
}
