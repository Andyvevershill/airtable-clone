ALTER TABLE "view" ADD COLUMN "is_active" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "view_active_unique_idx" ON "view" USING btree ("table_id") WHERE is_active = true;