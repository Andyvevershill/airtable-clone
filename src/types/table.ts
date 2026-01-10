import type { View } from "@/server/db/schemas";
import { z } from "zod";

const tableSchema = z.object({
  id: z.string(),
  baseId: z.string(),

  name: z.string(),
  description: z.string().nullable(),
  isFavourite: z.boolean(),

  lastAccessedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});

export type Table = z.infer<typeof tableSchema>;

export type TableWithViews = Table & { views: View[] };
