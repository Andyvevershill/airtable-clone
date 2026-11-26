ALTER TABLE "cell" DROP COLUMN "id";--> statement-breakpoint
-- reuse the existing (row_id, column_id) index as the pk so we don't rebuild it
ALTER TABLE "cell" ADD CONSTRAINT "cell_row_id_column_id_pk" PRIMARY KEY USING INDEX "cell_row_column_unique_idx";--> statement-breakpoint
-- only keep the oldest active view per table before making it unique
UPDATE "view" SET "is_active" = false WHERE "is_active" = true AND "id" NOT IN (SELECT DISTINCT ON ("table_id") "id" FROM "view" WHERE "is_active" = true ORDER BY "table_id", "created_at");--> statement-breakpoint
DROP INDEX "view_active_unique_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "view_active_unique_idx" ON "view" USING btree ("table_id") WHERE is_active = true;
