CREATE TABLE "base" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"colour" text NOT NULL,
	"is_favourite" boolean NOT NULL,
	"last_accessed_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "cell" (
	"id" text PRIMARY KEY NOT NULL,
	"row_id" text NOT NULL,
	"column_id" text NOT NULL,
	"value" text,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "column" (
	"id" text PRIMARY KEY NOT NULL,
	"table_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "row" (
	"id" text PRIMARY KEY NOT NULL,
	"table_id" text NOT NULL,
	"position" bigint GENERATED ALWAYS AS IDENTITY (sequence name "row_position_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "table" (
	"id" text PRIMARY KEY NOT NULL,
	"base_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_favourite" boolean NOT NULL,
	"last_accessed_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "view" (
	"id" text PRIMARY KEY NOT NULL,
	"table_id" text NOT NULL,
	"name" text NOT NULL,
	"filters" json,
	"sorts" json,
	"hidden_columns" json,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "base" ADD CONSTRAINT "base_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cell" ADD CONSTRAINT "cell_row_id_row_id_fk" FOREIGN KEY ("row_id") REFERENCES "public"."row"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cell" ADD CONSTRAINT "cell_column_id_column_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."column"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "column" ADD CONSTRAINT "column_table_id_table_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "row" ADD CONSTRAINT "row_table_id_table_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table" ADD CONSTRAINT "table_base_id_base_id_fk" FOREIGN KEY ("base_id") REFERENCES "public"."base"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view" ADD CONSTRAINT "view_table_id_table_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "base_user_idx" ON "base" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "base_last_accessed_idx" ON "base" USING btree ("user_id","last_accessed_at");--> statement-breakpoint
CREATE INDEX "cell_row_idx" ON "cell" USING btree ("row_id");--> statement-breakpoint
CREATE INDEX "cell_column_idx" ON "cell" USING btree ("column_id");--> statement-breakpoint
CREATE INDEX "cell_row_column_unique_idx" ON "cell" USING btree ("row_id","column_id");--> statement-breakpoint
CREATE INDEX "column_table_idx" ON "column" USING btree ("table_id");--> statement-breakpoint
CREATE INDEX "column_position_idx" ON "column" USING btree ("table_id","position");--> statement-breakpoint
CREATE INDEX "row_table_idx" ON "row" USING btree ("table_id");--> statement-breakpoint
CREATE INDEX "row_position_idx" ON "row" USING btree ("table_id","position");--> statement-breakpoint
CREATE INDEX "table_base_idx" ON "table" USING btree ("base_id");--> statement-breakpoint
CREATE INDEX "table_last_accessed_idx" ON "table" USING btree ("base_id","last_accessed_at");--> statement-breakpoint
CREATE INDEX "view_table_idx" ON "view" USING btree ("table_id");