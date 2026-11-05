CREATE TYPE "public"."activity_type" AS ENUM('course', 'reading', 'video', 'practice', 'project', 'other');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"goal_id" uuid NOT NULL,
	"type" "activity_type" NOT NULL,
	"description" text NOT NULL,
	"minutes" integer,
	"occurred_on" date NOT NULL,
	"project_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activities_description_check" CHECK ("activities"."description" = btrim("activities"."description") and "activities"."description" ~ '[^[:space:]]' and char_length("activities"."description") between 1 and 2000),
	CONSTRAINT "activities_minutes_check" CHECK ("activities"."minutes" between 1 and 1440),
	CONSTRAINT "activities_project_link_check" CHECK (("activities"."type" = 'project') = ("activities"."project_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"repo_url" text NOT NULL,
	"live_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_id_user_id_key" UNIQUE("id","user_id"),
	CONSTRAINT "projects_title_check" CHECK ("projects"."title" = btrim("projects"."title") and "projects"."title" ~ '[^[:space:]]' and char_length("projects"."title") between 1 and 160),
	CONSTRAINT "projects_description_check" CHECK (char_length("projects"."description") <= 5000),
	CONSTRAINT "projects_repo_url_check" CHECK ("projects"."repo_url" ~ '^https://[^[:space:]/?#]+[^[:space:]]*$' and char_length("projects"."repo_url") <= 2048),
	CONSTRAINT "projects_live_url_check" CHECK ("projects"."live_url" ~ '^https://[^[:space:]/?#]+[^[:space:]]*$' and char_length("projects"."live_url") <= 2048)
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_owned_goal_fkey" FOREIGN KEY ("goal_id","user_id") REFERENCES "public"."goals"("id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_owned_project_fkey" FOREIGN KEY ("project_id","user_id") REFERENCES "public"."projects"("id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_owner_date_idx" ON "activities" USING btree ("user_id","occurred_on");--> statement-breakpoint
CREATE INDEX "activities_goal_date_idx" ON "activities" USING btree ("goal_id","occurred_on" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "activities_project_idx" ON "activities" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "projects_owner_idx" ON "projects" USING btree ("user_id");