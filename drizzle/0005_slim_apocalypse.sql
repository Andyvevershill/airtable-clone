CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
DROP INDEX "cell_row_column_value_idx";--> statement-breakpoint
DROP INDEX "cell_value_lower_idx";--> statement-breakpoint
CREATE INDEX "cell_sort_text_idx" ON "cell" USING btree ("column_id",LOWER("value"),"row_id");--> statement-breakpoint
CREATE INDEX "cell_sort_number_idx" ON "cell" USING btree ("column_id",CAST("value" AS NUMERIC),"row_id");--> statement-breakpoint
CREATE INDEX "cell_value_trgm_idx" ON "cell" USING gin ("value" gin_trgm_ops) WHERE "cell"."value" IS NOT NULL;