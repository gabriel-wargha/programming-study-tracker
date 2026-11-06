CREATE TABLE "confidence_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"topic_id" uuid NOT NULL,
	"rating" smallint NOT NULL,
	"rated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "confidence_ratings_rating_check" CHECK ("confidence_ratings"."rating" between 1 and 5)
);
--> statement-breakpoint
ALTER TABLE "confidence_ratings" ADD CONSTRAINT "confidence_ratings_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "confidence_ratings" ADD CONSTRAINT "confidence_ratings_owned_topic_fkey" FOREIGN KEY ("topic_id","user_id") REFERENCES "public"."topics"("id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "confidence_ratings_topic_date_idx" ON "confidence_ratings" USING btree ("topic_id","rated_at" DESC NULLS LAST);