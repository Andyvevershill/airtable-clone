import type { db } from "@/server/db";
import { bases, columns, rows, tables, views } from "@/server/db/schemas/bases";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";

type Ctx = {
  db: typeof db;
  session: { user: { id: string } };
};

// return NOT_FOUND rather than FORBIDDEN so we don't leak what ids exist
function notFound(message: string): never {
  throw new TRPCError({ code: "NOT_FOUND", message });
}

export async function checkBaseOwner(ctx: Ctx, baseId: string) {
  const [base] = await ctx.db
    .select({ id: bases.id })
    .from(bases)
    .where(and(eq(bases.id, baseId), eq(bases.userId, ctx.session.user.id)))
    .limit(1);

  if (!base) notFound("Base not found");
}

export async function checkTableOwner(ctx: Ctx, tableId: string) {
  const [table] = await ctx.db
    .select({ id: tables.id })
    .from(tables)
    .innerJoin(bases, eq(bases.id, tables.baseId))
    .where(and(eq(tables.id, tableId), eq(bases.userId, ctx.session.user.id)))
    .limit(1);

  if (!table) notFound("Table not found");
}

export async function checkViewOwner(ctx: Ctx, viewId: string) {
  const [view] = await ctx.db
    .select({ tableId: views.tableId })
    .from(views)
    .innerJoin(tables, eq(tables.id, views.tableId))
    .innerJoin(bases, eq(bases.id, tables.baseId))
    .where(and(eq(views.id, viewId), eq(bases.userId, ctx.session.user.id)))
    .limit(1);

  if (!view) notFound("View not found");

  return view;
}

export async function checkColumnOwner(ctx: Ctx, columnId: string) {
  const [column] = await ctx.db
    .select({ tableId: columns.tableId })
    .from(columns)
    .innerJoin(tables, eq(tables.id, columns.tableId))
    .innerJoin(bases, eq(bases.id, tables.baseId))
    .where(and(eq(columns.id, columnId), eq(bases.userId, ctx.session.user.id)))
    .limit(1);

  if (!column) notFound("Column not found");

  return column;
}

// row and column must both be in the same table, and that table must be ours
export async function checkCellOwner(
  ctx: Ctx,
  rowId: string,
  columnId: string,
) {
  const [match] = await ctx.db
    .select({ id: rows.id })
    .from(rows)
    .innerJoin(columns, eq(columns.tableId, rows.tableId))
    .innerJoin(tables, eq(tables.id, rows.tableId))
    .innerJoin(bases, eq(bases.id, tables.baseId))
    .where(
      and(
        eq(rows.id, rowId),
        eq(columns.id, columnId),
        eq(bases.userId, ctx.session.user.id),
      ),
    )
    .limit(1);

  if (!match) notFound("Cell not found");
}
