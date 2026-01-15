import z from "zod";

const filterOperator = z.enum([
  // number filters
  "greaterThan",
  "lessThan",

  // string fields
  "contains",
  "notContains",
  // so like a search
  "equals",
  "isEmpty",
  "isNotEmpty",
]);

const filterRuleSchema = z.object({
  columnId: z.string(),
  operator: filterOperator,
  value: z.any().optional(),
  type: z.enum(["string", "number"]),
});

export type FilterState = z.infer<typeof filterRuleSchema>;

const sortRuleSchema = z.object({
  columnId: z.string(),
  direction: z.enum(["asc", "desc"]),
  type: z.enum(["string", "number"]),
});

export type SortRule = z.infer<typeof sortRuleSchema>;

export const getRowsInfiniteInput = z.object({
  tableId: z.string(),
  limit: z.number().min(1).max(5000).default(2500),
  cursor: z.number().nullish(),

  // Sorting - allow multiple for future-proofing
  sorting: z.array(sortRuleSchema).optional().default([]),

  // Filters - array = multiple conditions (AND between them)
  filters: z.array(filterRuleSchema).optional().default([]),

  // Optional global search across all text columns
  globalSearch: z.string().optional(),
});

export const viewInputSchema = z.object({
  id: z.string(),
  name: z.string(),
  filters: z.array(filterRuleSchema).optional().default([]),
  sorting: z.array(sortRuleSchema).optional().default([]),
  hidden: z.array(z.string()).optional().default([]),
});

export type ViewInput = z.infer<typeof viewInputSchema>;
