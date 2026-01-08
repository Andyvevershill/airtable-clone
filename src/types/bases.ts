import { z } from "zod";

const baseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),

  icon: z.string().nullable(),
  color: z.string(),
  isFavourite: z.boolean(),

  lastAccessedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});

export type Base = z.infer<typeof baseSchema>;
