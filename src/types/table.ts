import type { View } from "@/server/db/schemas";
import { z } from "zod";

const tableSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type Table = z.infer<typeof tableSchema>;

export type TableWithViews = Table & { views: View[] };
