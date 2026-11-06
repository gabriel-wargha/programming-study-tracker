CREATE TYPE "public"."blocker_status" AS ENUM('open', 'solved');--> statement-breakpoint
CREATE TYPE "public"."resource_status" AS ENUM('to_do', 'in_progress', 'finished');--> statement-breakpoint
CREATE TYPE "public"."resource_type" AS ENUM('course', 'docs', 'video', 'article', 'book', 'other');--> statement-breakpoint
CREATE TABLE "blockers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"goal_id" uuid NOT NULL,
	"title" text NOT NULL,
	"details" text,
	"status" "blocker_status" DEFAULT 'open' NOT NULL,
	"solution" text,
	"solved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blockers_title_check" CHECK ("blockers"."title" = btrim("blockers"."title") and "blockers"."title" ~ '[^[:space:]]' and char_length("blockers"."title") between 1 and 160),
	CONSTRAINT "blockers_details_check" CHECK (char_length("blockers"."details") <= 5000),
	CONSTRAINT "blockers_solution_check" CHECK (char_length("blockers"."solution") <= 5000),
	CONSTRAINT "blockers_solved_needs_solution_check" CHECK ("blockers"."status" <> 'solved' or "blockers"."solution" ~ '[^[:space:]]')
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"topic_id" uuid NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"type" "resource_type" NOT NULL,
	"status" "resource_status" DEFAULT 'to_do' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resources_id_user_id_key" UNIQUE("id","user_id"),
	CONSTRAINT "resources_title_check" CHECK ("resources"."title" = btrim("resources"."title") and "resources"."title" ~ '[^[:space:]]' and char_length("resources"."title") between 1 and 200),
	CONSTRAINT "resources_url_check" CHECK ("resources"."url" ~ '^https://[^[:space:]/?#]+[^[:space:]]*$' and char_length("resources"."url") <= 2048)
);
--> statement-breakpoint
CREATE TABLE "topic_prerequisites" (
	"user_id" text NOT NULL,
	"topic_id" uuid NOT NULL,
	"prerequisite_topic_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "topic_prerequisites_pkey" PRIMARY KEY("topic_id","prerequisite_topic_id"),
	CONSTRAINT "topic_prerequisites_not_self_check" CHECK ("topic_prerequisites"."topic_id" <> "topic_prerequisites"."prerequisite_topic_id")
);
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "resource_id" uuid;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "github_full_name" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "github_description" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "github_primary_language" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "github_languages" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "github_last_commit_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "github_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "blockers" ADD CONSTRAINT "blockers_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blockers" ADD CONSTRAINT "blockers_owned_goal_fkey" FOREIGN KEY ("goal_id","user_id") REFERENCES "public"."goals"("id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_owned_topic_fkey" FOREIGN KEY ("topic_id","user_id") REFERENCES "public"."topics"("id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_prerequisites" ADD CONSTRAINT "topic_prerequisites_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_prerequisites" ADD CONSTRAINT "topic_prerequisites_owned_topic_fkey" FOREIGN KEY ("topic_id","user_id") REFERENCES "public"."topics"("id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_prerequisites" ADD CONSTRAINT "topic_prerequisites_owned_prerequisite_fkey" FOREIGN KEY ("prerequisite_topic_id","user_id") REFERENCES "public"."topics"("id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blockers_goal_idx" ON "blockers" USING btree ("goal_id","user_id");--> statement-breakpoint
CREATE INDEX "resources_topic_idx" ON "resources" USING btree ("topic_id","user_id");--> statement-breakpoint
CREATE INDEX "topic_prerequisites_owner_idx" ON "topic_prerequisites" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_owned_resource_fkey" FOREIGN KEY ("resource_id","user_id") REFERENCES "public"."resources"("id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_resource_idx" ON "activities" USING btree ("resource_id");