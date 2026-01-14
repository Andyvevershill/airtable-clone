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
  value: z.any().optional(), // string | number | null depending on op
  type: z.enum(["string", "number"]).default("string"),
});

export const getRowsInfiniteInput = z.object({
  tableId: z.string(),
  limit: z.number().min(1).max(5000).default(2500),
  cursor: z.number().nullish(),

  // Sorting - allow multiple for future-proofing (most tables support it)
  sorting: z
    .array(
      z.object({
        columnId: z.string(),
        direction: z.enum(["asc", "desc"]),
        type: z.enum(["string", "number"]).default("string"),
      }),
    )
    .optional()
    .default([]),

  // Filters - array = multiple conditions (AND between them)
  filters: z.array(filterRuleSchema).optional().default([]),

  // Optional global search across all text columns
  globalSearch: z.string().optional(),
});

export type SortingRule = {
  columnId: string;
  direction: "asc" | "desc";
  type: "string" | "number";
} | null;

export type SortingState = SortingRule;
