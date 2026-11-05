import { sql } from "drizzle-orm";
import {
  type AnyPgColumn, check, date, foreignKey, index, integer, pgEnum, pgTable, smallint, text, timestamp, unique, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";

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

export const goalStatus = pgEnum("goal_status", ["planned", "active", "completed", "archived"]);

/** Required text: trimmed, not blank, and within a length limit. */
const requiredText = (column: AnyPgColumn, max: number) =>
  sql`${column} = btrim(${column}) and ${column} ~ '[^[:space:]]' and char_length(${column}) between 1 and ${sql.raw(String(max))}`;

export const topics = pgTable(
  "topics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    // Lets goals reference a topic together with its owner.
    unique("topics_id_user_id_key").on(table.id, table.userId),
    uniqueIndex("topics_owner_name_key").on(table.userId, sql`lower(${table.name})`),
    check("topics_name_check", requiredText(table.name, 100)),
    check("topics_description_check", sql`char_length(${table.description}) <= 5000`),
  ],
);

export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
    topicId: uuid("topic_id").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    definitionOfDone: text("definition_of_done").notNull(),
    status: goalStatus("status").notNull().default("planned"),
    targetDate: date("target_date", { mode: "string" }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    unique("goals_id_user_id_key").on(table.id, table.userId),
    // A goal can only belong to a topic owned by the same user.
    foreignKey({
      name: "goals_owned_topic_fkey",
      columns: [table.topicId, table.userId],
      foreignColumns: [topics.id, topics.userId],
    }),
    index("goals_owner_status_idx").on(table.userId, table.status),
    index("goals_topic_idx").on(table.topicId, table.userId),
    check("goals_title_check", requiredText(table.title, 160)),
    check("goals_description_check", sql`char_length(${table.description}) <= 5000`),
    check("goals_definition_of_done_check", requiredText(table.definitionOfDone, 2000)),
    check(
      "goals_completion_timestamp_check",
      sql`(${table.status} = 'completed' and ${table.completedAt} is not null)
        or (${table.status} in ('planned', 'active') and ${table.completedAt} is null)
        or ${table.status} = 'archived'`,
    ),
  ],
);

export const activityType = pgEnum("activity_type", ["course", "reading", "video", "practice", "project", "other"]);

/** An absolute `https` URL with no whitespace, within the length limit. */
const httpsUrl = (column: AnyPgColumn) =>
  sql`${column} ~ '^https://[^[:space:]/?#]+[^[:space:]]*$' and char_length(${column}) <= 2048`;

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    repoUrl: text("repo_url").notNull(),
    liveUrl: text("live_url"),
    ...timestamps,
  },
  (table) => [
    // Lets activities reference a project together with its owner.
    unique("projects_id_user_id_key").on(table.id, table.userId),
    index("projects_owner_idx").on(table.userId),
    check("projects_title_check", requiredText(table.title, 160)),
    check("projects_description_check", sql`char_length(${table.description}) <= 5000`),
    check("projects_repo_url_check", httpsUrl(table.repoUrl)),
    check("projects_live_url_check", httpsUrl(table.liveUrl)),
  ],
);

/** One dated thing the owner did for a goal. A weekly log is the activities in that week. */
export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
    goalId: uuid("goal_id").notNull(),
    type: activityType("type").notNull(),
    description: text("description").notNull(),
    minutes: integer("minutes"),
    occurredOn: date("occurred_on", { mode: "string" }).notNull(),
    projectId: uuid("project_id"),
    ...timestamps,
  },
  (table) => [
    // An activity can only point at a goal and a project owned by the same user.
    foreignKey({
      name: "activities_owned_goal_fkey",
      columns: [table.goalId, table.userId],
      foreignColumns: [goals.id, goals.userId],
    }),
    foreignKey({
      name: "activities_owned_project_fkey",
      columns: [table.projectId, table.userId],
      foreignColumns: [projects.id, projects.userId],
    }),
    index("activities_owner_date_idx").on(table.userId, table.occurredOn),
    index("activities_goal_date_idx").on(table.goalId, table.occurredOn.desc()),
    index("activities_project_idx").on(table.projectId),
    check("activities_description_check", requiredText(table.description, 2000)),
    check("activities_minutes_check", sql`${table.minutes} between 1 and 1440`),
    check("activities_project_link_check", sql`(${table.type} = 'project') = (${table.projectId} is not null)`),
  ],
);

export type Topic = typeof topics.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Activity = typeof activities.$inferSelect;
