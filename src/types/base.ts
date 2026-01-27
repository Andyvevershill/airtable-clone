import { z } from "zod";

const baseSchema = z.object({
  id: z.string(),
  name: z.string(),
  lastAccessedAt: z.date(),
  // icon: z.string().nullable(),
  colour: z.string(),
  isFavourite: z.boolean(),
});

export type Base = z.infer<typeof baseSchema>;

// WE ADD IN THE ID OF THE FIRST TABLE WITHIN THE BASE, SO WE CAN PREFETCH THIS DATA ON HOVERING OVER THE BASE CARD IN DASHBOARD
export type BaseWithTables = Base & {
  tables: {
    id: string;
    name: string;
  }[];
};

export type typeBaseWithTableIds = Base & {
  tables: {
    id: string;
  }[];
};
