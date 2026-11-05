CREATE TYPE "public"."goal_status" AS ENUM('planned', 'active', 'completed', 'archived');--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"topic_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"definition_of_done" text NOT NULL,
	"status" "goal_status" DEFAULT 'planned' NOT NULL,
	"target_date" date,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "goals_id_user_id_key" UNIQUE("id","user_id"),
	CONSTRAINT "goals_title_check" CHECK ("goals"."title" = btrim("goals"."title") and "goals"."title" ~ '[^[:space:]]' and char_length("goals"."title") between 1 and 160),
	CONSTRAINT "goals_description_check" CHECK (char_length("goals"."description") <= 5000),
	CONSTRAINT "goals_definition_of_done_check" CHECK ("goals"."definition_of_done" = btrim("goals"."definition_of_done") and "goals"."definition_of_done" ~ '[^[:space:]]' and char_length("goals"."definition_of_done") between 1 and 2000),
	CONSTRAINT "goals_completion_timestamp_check" CHECK (("goals"."status" = 'completed' and "goals"."completed_at" is not null)
        or ("goals"."status" in ('planned', 'active') and "goals"."completed_at" is null)
        or "goals"."status" = 'archived')
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "topics_id_user_id_key" UNIQUE("id","user_id"),
	CONSTRAINT "topics_name_check" CHECK ("topics"."name" = btrim("topics"."name") and "topics"."name" ~ '[^[:space:]]' and char_length("topics"."name") between 1 and 100),
	CONSTRAINT "topics_description_check" CHECK (char_length("topics"."description") <= 5000)
);
--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_owned_topic_fkey" FOREIGN KEY ("topic_id","user_id") REFERENCES "public"."topics"("id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "goals_owner_status_idx" ON "goals" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "goals_topic_idx" ON "goals" USING btree ("topic_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "topics_owner_name_key" ON "topics" USING btree ("user_id",lower("name"));