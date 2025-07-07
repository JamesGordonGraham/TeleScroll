import { pgTable, text, serial, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const teleprompterSettings = pgTable("teleprompter_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  fontSize: integer("font_size").notNull().default(32),
  lineHeight: real("line_height").notNull().default(1.6),
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
});

export const insertTeleprompterSettingsSchema = createInsertSchema(teleprompterSettings).omit({
  id: true,
});

export const insertScriptSchema = createInsertSchema(scripts).omit({
  id: true,
});

export type TeleprompterSettings = typeof teleprompterSettings.$inferSelect;
export type InsertTeleprompterSettings = z.infer<typeof insertTeleprompterSettingsSchema>;
export type Script = typeof scripts.$inferSelect;
export type InsertScript = z.infer<typeof insertScriptSchema>;
