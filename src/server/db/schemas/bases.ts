import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./users";

export type ColumnType = "text" | "number";

export type FilterOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "greater_than"
  | "less_than"
  | "greater_than_or_equal"
  | "less_than_or_equal";

export interface ViewFilter {
  columnId: string;
  operator: FilterOperator;
  value: string;
}

export interface ViewSort {
  columnId: string;
  direction: "asc" | "desc";
}

/* -------------------------------------------------------------------------- */
/*                                   Enums                                    */
/* -------------------------------------------------------------------------- */

export const columnTypeEnum = pgEnum("column_type", ["text", "number"]);

/* -------------------------------------------------------------------------- */
/*                                   Tables                                   */
/* -------------------------------------------------------------------------- */

export const bases = pgTable(
  "base",
  {
    id: text("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    icon: text("icon"),
    colour: text("colour").notNull(),
    isFavourite: boolean("is_favourite")
      .$defaultFn(() => false)
      .notNull(),

    lastAccessedAt: timestamp("last_accessed_at").notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    index("base_user_idx").on(table.userId),
    index("base_last_accessed_idx").on(table.userId, table.lastAccessedAt),
  ],
);

export const tables = pgTable(
  "table",
  {
    id: text("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => createId()),
    baseId: text("base_id")
      .notNull()
      .references(() => bases.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    description: text("description"),
    isFavourite: boolean("is_favourite")
      .$defaultFn(() => false)
      .notNull(),

    lastAccessedAt: timestamp("last_accessed_at").$defaultFn(() => new Date()),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    index("table_base_idx").on(table.baseId),
    index("table_last_accessed_idx").on(table.baseId, table.lastAccessedAt),
  ],
);

export const columns = pgTable(
  "column",
  {
    id: text("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => createId()),
    tableId: text("table_id")
      .notNull()
      .references(() => tables.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    type: text("type").notNull(), // 'text' | 'number'
    position: integer("position").notNull(),

    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    index("column_table_idx").on(table.tableId),
    index("column_position_idx").on(table.tableId, table.position),
  ],
);

export const rows = pgTable(
  "row",
  {
    id: text("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => createId()),
    tableId: text("table_id")
      .notNull()
      .references(() => tables.id, { onDelete: "cascade" }),

    position: integer("position").notNull(),

    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    index("row_table_idx").on(table.tableId),
    index("row_position_idx").on(table.tableId, table.position),
  ],
);

export const cells = pgTable(
  "cell",
  {
    id: text("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => createId()),
    rowId: text("row_id")
      .notNull()
      .references(() => rows.id, { onDelete: "cascade" }),
    columnId: text("column_id")
      .notNull()
      .references(() => columns.id, { onDelete: "cascade" }),

    value: text("value"),

    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    index("cell_row_idx").on(table.rowId),
    index("cell_column_idx").on(table.columnId),
    // Composite unique constraint
    index("cell_row_column_unique_idx").on(table.rowId, table.columnId),
  ],
);

export const views = pgTable(
  "view",
  {
    id: text("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => createId()),
    tableId: text("table_id")
      .notNull()
      .references(() => tables.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    filters: json("filters").$type<
      {
        columnId: number;
        operator: string;
        value: string;
      }[]
    >(),
    sorts: json("sorts").$type<
      {
        columnId: number;
        direction: "asc" | "desc";
      }[]
    >(),
    hiddenColumns: json("hidden_columns").$type<number[]>(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [index("view_table_idx").on(table.tableId)],
);

// Relations

export const baseRelations = relations(bases, ({ one, many }) => ({
  user: one(user, { fields: [bases.userId], references: [user.id] }),
  tables: many(tables),
}));

export const tableRelations = relations(tables, ({ one, many }) => ({
  base: one(bases, { fields: [tables.baseId], references: [bases.id] }),
  columns: many(columns),
  rows: many(rows),
  views: many(views),
}));

export const columnRelations = relations(columns, ({ one, many }) => ({
  table: one(tables, { fields: [columns.tableId], references: [tables.id] }),
  cells: many(cells),
}));

export const rowRelations = relations(rows, ({ one, many }) => ({
  table: one(tables, { fields: [rows.tableId], references: [tables.id] }),
  cells: many(cells),
}));

export const cellRelations = relations(cells, ({ one }) => ({
  row: one(rows, { fields: [cells.rowId], references: [rows.id] }),
  column: one(columns, { fields: [cells.columnId], references: [columns.id] }),
}));

export const viewRelations = relations(views, ({ one }) => ({
  table: one(tables, { fields: [views.tableId], references: [tables.id] }),
}));
