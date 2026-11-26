import z from "zod";

const filterOperator = z.enum([
  // number filters
  "greaterThan",
  "lessThan",

  // string fields
  "contains",
  "notContains",
  "equals",
  "isEmpty",
  "isNotEmpty",
]);

const filterRuleSchema = z.object({
  columnId: z.string(),
  operator: filterOperator,
  value: z.union([z.string().max(500), z.number()]).nullish(),
  type: z.enum(["string", "number"]),
});

export type FilterState = z.infer<typeof filterRuleSchema>;

const sortRuleSchema = z.object({
  columnId: z.string(),
  direction: z.enum(["asc", "desc"]),
  type: z.enum(["string", "number"]),
});

export type SortRule = z.infer<typeof sortRuleSchema>;

// what the grid is showing right now - shared by the rows pages and search
export const rowQueryInput = z.object({
  tableId: z.string(),
  limit: z.number().int().min(1).max(5000).default(500),

  // Sorting - allow multiple for future-proofing
  sorting: z.array(sortRuleSchema).max(25).optional().default([]),

  // Filters - array = multiple conditions (AND between them)
  filters: z.array(filterRuleSchema).max(25).optional().default([]),
});

// page number instead of a cursor so we can jump straight to any part of the table
export const getRowsInput = rowQueryInput.extend({
  page: z.number().int().min(0),
});

export const searchMatchesInput = rowQueryInput.omit({ limit: true }).extend({
  search: z.string().max(200),
});

export const viewInputSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  filters: z.array(filterRuleSchema).optional().default([]),
  sorting: z.array(sortRuleSchema).optional().default([]),
  hidden: z.array(z.string()).optional().default([]),
});

export type ViewInput = z.infer<typeof viewInputSchema>;

// split up the 3 seperate types for the 3 different updates
// this way keeps the updates small, and allows each form to manage own updates

export const viewSortingUpdateSchema = z.object({
  id: z.string(),
  sorting: z.array(sortRuleSchema).optional().default([]),
});

export type ViewSortingUpdateInput = z.infer<typeof viewSortingUpdateSchema>;

export const viewFilteringUpdateSchema = z.object({
  id: z.string(),
  filters: z.array(filterRuleSchema).optional().default([]),
});

export type ViewFilteringUpdateInput = z.infer<
  typeof viewFilteringUpdateSchema
>;

export const viewHiddenUpdateSchema = z.object({
  id: z.string(),
  hidden: z.array(z.string()).optional().default([]),
});

export type ViewHiddenUpdateInput = z.infer<typeof viewHiddenUpdateSchema>;

export type SearchMatch =
  | { type: "column"; columnId: string }
  | {
      type: "cell";
      cellId: string;
      rowIndex: number;
    };

export type QueryParams = z.infer<typeof rowQueryInput>;
