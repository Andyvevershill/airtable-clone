"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const RANGE_OPTIONS = {
  today: "Opened today",
  last_7_days: "Opened in the past 7 days",
  last_30_days: "Opened in the past 30 days",
  anytime: "Opened anytime",
} as const;

export default function DateRangeDropdownSelector() {
  const [range, setRange] = useState<keyof typeof RANGE_OPTIONS>("today");

  return (
    <Select
      value={range}
      onValueChange={(value: keyof typeof RANGE_OPTIONS) => setRange(value)}
    >
      <SelectTrigger className="border-0 bg-transparent pl-0 shadow-none">
        <SelectValue>{RANGE_OPTIONS[range]}</SelectValue>
      </SelectTrigger>
      <SelectContent align="start" position="popper" className="w-60 p-3">
        <SelectItem value="today">Today</SelectItem>
        <SelectItem value="last_7_days">In the past 7 days</SelectItem>
        <SelectItem value="last_30_days">In the past 30 days</SelectItem>
        <SelectItem value="anytime">Anytime</SelectItem>
      </SelectContent>
    </Select>
  );
}
