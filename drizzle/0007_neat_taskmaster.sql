CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
DROP INDEX "cell_row_idx";--> statement-breakpoint
DROP INDEX "cell_column_idx";--> statement-breakpoint
DROP INDEX "cell_row_column_unique_idx";--> statement-breakpoint
DROP INDEX "cell_value_lower_idx";--> statement-breakpoint
DROP INDEX "row_table_idx";--> statement-breakpoint
CREATE INDEX "cell_column_value_lower_idx" ON "cell" USING btree ("column_id",LOWER("value"));--> statement-breakpoint
CREATE INDEX "cell_value_trgm_idx" ON "cell" USING gin ("value" gin_trgm_ops) WHERE "cell"."value" IS NOT NULL;