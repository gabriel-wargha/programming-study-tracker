CREATE TABLE "review_reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"goal_id" uuid NOT NULL,
	"stage" smallint NOT NULL,
	"due_on" date NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_reminders_goal_stage_key" UNIQUE("goal_id","stage"),
	CONSTRAINT "review_reminders_stage_check" CHECK ("review_reminders"."stage" in (1, 2))
);
--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "portfolio_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "portfolio_slug" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "portfolio_headline" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "review_reminders" ADD CONSTRAINT "review_reminders_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_reminders" ADD CONSTRAINT "review_reminders_owned_goal_fkey" FOREIGN KEY ("goal_id","user_id") REFERENCES "public"."goals"("id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "review_reminders_owner_due_idx" ON "review_reminders" USING btree ("user_id","due_on");--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_portfolio_slug_key" UNIQUE("portfolio_slug");--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_public_needs_completed_check" CHECK (not "goals"."is_public" or "goals"."status" = 'completed');--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_portfolio_slug_check" CHECK ("profiles"."portfolio_slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length("profiles"."portfolio_slug") between 3 and 60);--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_portfolio_headline_check" CHECK (char_length("profiles"."portfolio_headline") <= 200);--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_github_username_check" CHECK ("profiles"."github_username" ~ '^[A-Za-z0-9](-?[A-Za-z0-9])*$' and char_length("profiles"."github_username") <= 39);--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_portfolio_needs_slug_check" CHECK (not "profiles"."portfolio_enabled" or "profiles"."portfolio_slug" is not null);