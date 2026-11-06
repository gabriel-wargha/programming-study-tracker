import { sql } from "drizzle-orm";
import {
  type AnyPgColumn, boolean, check, date, foreignKey, index, integer, jsonb, pgEnum, pgTable, pgView, primaryKey, smallint, text, timestamp, unique, uniqueIndex, uuid,
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
    portfolioEnabled: boolean("portfolio_enabled").notNull().default(false),
    portfolioSlug: text("portfolio_slug").unique("profiles_portfolio_slug_key"),
    portfolioHeadline: text("portfolio_headline"),
    ...timestamps,
  },
  (table) => [
    check("profiles_user_id_check", sql`char_length(${table.userId}) between 1 and 255`),
    check("profiles_active_goal_limit_check", sql`${table.activeGoalLimit} between 1 and 10`),
    check("profiles_portfolio_slug_check", sql`${table.portfolioSlug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(${table.portfolioSlug}) between 3 and 60`),
    check("profiles_portfolio_headline_check", sql`char_length(${table.portfolioHeadline}) <= 200`),
    check("profiles_github_username_check", sql`${table.githubUsername} ~ '^[A-Za-z0-9](-?[A-Za-z0-9])*$' and char_length(${table.githubUsername}) <= 39`),
    check("profiles_portfolio_needs_slug_check", sql`not ${table.portfolioEnabled} or ${table.portfolioSlug} is not null`),
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
    isPublic: boolean("is_public").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    check("goals_public_needs_completed_check", sql`not ${table.isPublic} or ${table.status} = 'completed'`),
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
    // Details of public GitHub repositories, filled in by the sync. Null for other hosts.
    githubFullName: text("github_full_name"),
    githubDescription: text("github_description"),
    githubPrimaryLanguage: text("github_primary_language"),
    githubLanguages: jsonb("github_languages").$type<Record<string, number>>(),
    githubLastCommitAt: timestamp("github_last_commit_at", { withTimezone: true }),
    githubSyncedAt: timestamp("github_synced_at", { withTimezone: true }),
    isPublic: boolean("is_public").notNull().default(false),
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

export const resourceType = pgEnum("resource_type", ["course", "docs", "video", "article", "book", "other"]);
export const resourceStatus = pgEnum("resource_status", ["to_do", "in_progress", "finished"]);
export const blockerStatus = pgEnum("blocker_status", ["open", "solved"]);

/** A learning resource saved under a topic. */
export const resources = pgTable(
  "resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
    topicId: uuid("topic_id").notNull(),
    title: text("title").notNull(),
    url: text("url"),
    type: resourceType("type").notNull(),
    status: resourceStatus("status").notNull().default("to_do"),
    ...timestamps,
  },
  (table) => [
    unique("resources_id_user_id_key").on(table.id, table.userId),
    foreignKey({
      name: "resources_owned_topic_fkey",
      columns: [table.topicId, table.userId],
      foreignColumns: [topics.id, topics.userId],
    }),
    index("resources_topic_idx").on(table.topicId, table.userId),
    check("resources_title_check", requiredText(table.title, 200)),
    check("resources_url_check", httpsUrl(table.url)),
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
    resourceId: uuid("resource_id"),
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
    foreignKey({
      name: "activities_owned_resource_fkey",
      columns: [table.resourceId, table.userId],
      foreignColumns: [resources.id, resources.userId],
    }),
    index("activities_resource_idx").on(table.resourceId),
    index("activities_owner_date_idx").on(table.userId, table.occurredOn),
    index("activities_goal_date_idx").on(table.goalId, table.occurredOn.desc()),
    index("activities_project_idx").on(table.projectId),
    check("activities_description_check", requiredText(table.description, 2000)),
    check("activities_minutes_check", sql`${table.minutes} between 1 and 1440`),
    check("activities_project_link_check", sql`(${table.type} = 'project') = (${table.projectId} is not null)`),
  ],
);

/** Every rating is kept, so a topic can show how confidence changes over time. */
export const confidenceRatings = pgTable(
  "confidence_ratings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
    topicId: uuid("topic_id").notNull(),
    rating: smallint("rating").notNull(),
    ratedAt: timestamp("rated_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamps.createdAt,
  },
  (table) => [
    foreignKey({
      name: "confidence_ratings_owned_topic_fkey",
      columns: [table.topicId, table.userId],
      foreignColumns: [topics.id, topics.userId],
    }),
    index("confidence_ratings_topic_date_idx").on(table.topicId, table.ratedAt.desc()),
    check("confidence_ratings_rating_check", sql`${table.rating} between 1 and 5`),
  ],
);

/** A problem met while working on a goal, and how it was solved. */
export const blockers = pgTable(
  "blockers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
    goalId: uuid("goal_id").notNull(),
    title: text("title").notNull(),
    details: text("details"),
    status: blockerStatus("status").notNull().default("open"),
    solution: text("solution"),
    solvedAt: timestamp("solved_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      name: "blockers_owned_goal_fkey",
      columns: [table.goalId, table.userId],
      foreignColumns: [goals.id, goals.userId],
    }),
    index("blockers_goal_idx").on(table.goalId, table.userId),
    check("blockers_title_check", requiredText(table.title, 160)),
    check("blockers_details_check", sql`char_length(${table.details}) <= 5000`),
    check("blockers_solution_check", sql`char_length(${table.solution}) <= 5000`),
    check("blockers_solved_needs_solution_check", sql`${table.status} <> 'solved' or (${table.solution} is not null and ${table.solution} ~ '[^[:space:]]')`),
  ],
);

/** Topic A lists topic B as something to learn first. */
export const topicPrerequisites = pgTable(
  "topic_prerequisites",
  {
    userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
    topicId: uuid("topic_id").notNull(),
    prerequisiteTopicId: uuid("prerequisite_topic_id").notNull(),
    createdAt: timestamps.createdAt,
  },
  (table) => [
    primaryKey({ name: "topic_prerequisites_pkey", columns: [table.topicId, table.prerequisiteTopicId] }),
    foreignKey({
      name: "topic_prerequisites_owned_topic_fkey",
      columns: [table.topicId, table.userId],
      foreignColumns: [topics.id, topics.userId],
    }),
    foreignKey({
      name: "topic_prerequisites_owned_prerequisite_fkey",
      columns: [table.prerequisiteTopicId, table.userId],
      foreignColumns: [topics.id, topics.userId],
    }),
    index("topic_prerequisites_owner_idx").on(table.userId),
    check("topic_prerequisites_not_self_check", sql`${table.topicId} <> ${table.prerequisiteTopicId}`),
  ],
);

/** Prompts to review a completed goal: stage 1 after 7 days, stage 2 after 30 more. */
export const reviewReminders = pgTable(
  "review_reminders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
    goalId: uuid("goal_id").notNull(),
    stage: smallint("stage").notNull(),
    dueOn: date("due_on", { mode: "string" }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    unique("review_reminders_goal_stage_key").on(table.goalId, table.stage),
    foreignKey({
      name: "review_reminders_owned_goal_fkey",
      columns: [table.goalId, table.userId],
      foreignColumns: [goals.id, goals.userId],
    }),
    index("review_reminders_owner_due_idx").on(table.userId, table.dueOn),
    check("review_reminders_stage_check", sql`${table.stage} in (1, 2)`),
  ],
);

/**
 * Totals per goal, created in drizzle/0007_progress_rules.sql with
 * `security_invoker = true`. `user_id` is included so queries can filter by owner.
 */
export const goalActivitySummary = pgView("goal_activity_summary", {
  goalId: uuid("goal_id").notNull(),
  userId: text("user_id").notNull(),
  lastActivityOn: date("last_activity_on", { mode: "string" }).notNull(),
  activityCount: integer("activity_count").notNull(),
  totalMinutes: integer("total_minutes").notNull(),
}).existing();

export type Topic = typeof topics.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Activity = typeof activities.$inferSelect;
