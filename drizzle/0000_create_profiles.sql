CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"display_name" text,
	"github_username" text,
	"active_goal_limit" smallint DEFAULT 3 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_user_id_check" CHECK (char_length("profiles"."user_id") between 1 and 255),
	CONSTRAINT "profiles_active_goal_limit_check" CHECK ("profiles"."active_goal_limit" between 1 and 10)
);
