import { sql } from "drizzle-orm";
import { check, pgTable, smallint, text, timestamp } from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/**
 * One row per user. `user_id` is the local owner ID now and the Neon Auth user
 * ID from Phase 8. It is text with no foreign key into the Neon-managed schema.
 */
export const profiles = pgTable(
  "profiles",
  {
    userId: text("user_id").primaryKey(),
    displayName: text("display_name"),
    githubUsername: text("github_username"),
    activeGoalLimit: smallint("active_goal_limit").notNull().default(3),
    ...timestamps,
  },
  (table) => [
    check("profiles_user_id_check", sql`char_length(${table.userId}) between 1 and 255`),
    check("profiles_active_goal_limit_check", sql`${table.activeGoalLimit} between 1 and 10`),
  ],
);

export type Profile = typeof profiles.$inferSelect;
