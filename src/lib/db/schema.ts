import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  bigint,
  integer,
} from "drizzle-orm/pg-core";

// ============================================
// Users — Admin users
// ============================================
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================
// Articles — Blog posts (AI or manual)
// ============================================
export const articles = pgTable("articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").unique().notNull(),
  body: text("body").notNull(),
  summary: text("summary"),
  tags: text("tags").array().default([]),
  status: text("status").notNull().default("draft"),
  seoDescription: text("seo_description"),
  authorId: uuid("author_id").references(() => users.id, {
    onDelete: "set null",
  }),
  source: text("source").default("web"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

// ============================================
// Subscribers — Newsletter subscribers
// ============================================
export const subscribers = pgTable("subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  name: text("name"),
  confirmed: boolean("confirmed").notNull().default(false),
  confirmationToken: text("confirmation_token").unique(),
  subscribedAt: timestamp("subscribed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
});

// ============================================
// Telegram Sessions — Bot auth
// ============================================
export const telegramSessions = pgTable("telegram_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  telegramUserId: bigint("telegram_user_id", { mode: "number" })
    .unique()
    .notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  authenticated: boolean("authenticated").notNull().default(false),
  botStep: text("bot_step").notNull().default("idle"),
  pendingTopic: text("pending_topic"),
  pendingArticleId: uuid("pending_article_id").references(() => articles.id, {
    onDelete: "set null",
  }),
  generatingAt: timestamp("generating_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================
// Newsletter Logs — Dispatch tracking
// ============================================
export const newsletterLogs = pgTable("newsletter_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  articleId: uuid("article_id").references(() => articles.id, {
    onDelete: "cascade",
  }),
  totalSent: integer("total_sent").notNull().default(0),
  totalError: integer("total_error").notNull().default(0),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================
// Article Status History — Audit trail
// ============================================
export const articleStatusHistory = pgTable("article_status_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  articleId: uuid("article_id").references(() => articles.id, {
    onDelete: "cascade",
  }),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  changedBy: uuid("changed_by").references(() => users.id),
  changedAt: timestamp("changed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
