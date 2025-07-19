import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  real,
  varchar,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User management table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionTier: varchar("subscription_tier").notNull().default("free"), // free, pro, premium
  subscriptionStatus: varchar("subscription_status").notNull().default("active"), // active, cancelled, past_due
  usageMinutes: integer("usage_minutes").notNull().default(0), // Track usage for free tier (60 min limit)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const teleprompterSettings = pgTable("teleprompter_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  fontSize: integer("font_size").notNull().default(32),
  textWidth: integer("text_width").notNull().default(80),
  scrollSpeed: real("scroll_speed").notNull().default(1.0),
  smoothScrolling: boolean("smooth_scrolling").notNull().default(true),
  autoFullscreen: boolean("auto_fullscreen").notNull().default(false),
  hideCursor: boolean("hide_cursor").notNull().default(true),
});

export const scripts = pgTable("scripts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  scriptType: varchar("script_type"), // news, presentation, wedding, comedy, business, etc.
  generatedByAi: boolean("generated_by_ai").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Usage tracking for subscription limits
export const usageLogs = pgTable("usage_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  feature: varchar("feature").notNull(), // voice_input, ai_assistant, video_recording
  duration: integer("duration"), // in seconds
  timestamp: timestamp("timestamp").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertTeleprompterSettingsSchema = createInsertSchema(teleprompterSettings).omit({
  id: true,
});

export const insertScriptSchema = createInsertSchema(scripts).omit({
  id: true,
  createdAt: true,
});

export const insertUsageLogSchema = createInsertSchema(usageLogs).omit({
  id: true,
  timestamp: true,
});

// Upsert schema for users (for authentication)
export const upsertUserSchema = insertUserSchema.extend({
  id: z.string(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type TeleprompterSettings = typeof teleprompterSettings.$inferSelect;
export type InsertTeleprompterSettings = z.infer<typeof insertTeleprompterSettingsSchema>;
export type Script = typeof scripts.$inferSelect;
export type InsertScript = z.infer<typeof insertScriptSchema>;
export type UsageLog = typeof usageLogs.$inferSelect;
export type InsertUsageLog = z.infer<typeof insertUsageLogSchema>;
