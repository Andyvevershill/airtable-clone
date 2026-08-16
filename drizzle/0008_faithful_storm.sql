DROP INDEX "cell_row_column_value_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "cell_row_column_unique_idx" ON "cell" USING btree ("row_id","column_id");