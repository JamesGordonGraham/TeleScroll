import {
  users,
  teleprompterSettings,
  scripts,
  usageLogs,
  type User,
  type UpsertUser,
  type TeleprompterSettings,
  type InsertTeleprompterSettings,
  type Script,
  type InsertScript,
  type UsageLog,
  type InsertUsageLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, sum } from "drizzle-orm";

export interface IStorage {
  // User operations (required for authentication)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, customerId: string, subscriptionId: string): Promise<User>;
  updateUserSubscription(userId: string, tier: string, status: string): Promise<User>;
  
  // Settings
  getTeleprompterSettings(userId: string): Promise<TeleprompterSettings | undefined>;
  createTeleprompterSettings(settings: InsertTeleprompterSettings): Promise<TeleprompterSettings>;
  updateTeleprompterSettings(userId: string, settings: Partial<InsertTeleprompterSettings>): Promise<TeleprompterSettings>;
  
  // Scripts
  getScripts(userId: string): Promise<Script[]>;
  getScript(id: number): Promise<Script | undefined>;
  createScript(script: InsertScript): Promise<Script>;
  updateScript(id: number, script: Partial<InsertScript>): Promise<Script>;
  deleteScript(id: number): Promise<void>;
  
  // Usage tracking
  logUsage(usage: InsertUsageLog): Promise<UsageLog>;
  getUserUsage(userId: string, feature?: string): Promise<number>; // returns total minutes used
  canUseFeature(userId: string, feature: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private settings: Map<string, TeleprompterSettings>;
  private scripts: Map<number, Script>;
  private currentSettingsId: number;
  private currentScriptId: number;

  constructor() {
    this.settings = new Map();
    this.scripts = new Map();
    this.currentSettingsId = 1;
    this.currentScriptId = 1;
  }

  async getTeleprompterSettings(userId: string): Promise<TeleprompterSettings | undefined> {
    return Array.from(this.settings.values()).find(setting => setting.userId === userId);
  }

  async createTeleprompterSettings(insertSettings: InsertTeleprompterSettings): Promise<TeleprompterSettings> {
    const id = this.currentSettingsId++;
    const settings: TeleprompterSettings = { 
      id,
      userId: insertSettings.userId,
      fontSize: insertSettings.fontSize ?? 32,
      textWidth: insertSettings.textWidth ?? 80,
      scrollSpeed: insertSettings.scrollSpeed ?? 1.0,
      smoothScrolling: insertSettings.smoothScrolling ?? true,
      autoFullscreen: insertSettings.autoFullscreen ?? false,
      hideCursor: insertSettings.hideCursor ?? true,
    };
    this.settings.set(settings.userId, settings);
    return settings;
  }

  async updateTeleprompterSettings(userId: string, updateData: Partial<InsertTeleprompterSettings>): Promise<TeleprompterSettings> {
    const existing = await this.getTeleprompterSettings(userId);
    if (!existing) {
      throw new Error('Settings not found');
    }
    const updated: TeleprompterSettings = { ...existing, ...updateData };
    this.settings.set(existing.userId, updated);
    return updated;
  }

  async getScripts(userId: string): Promise<Script[]> {
    return Array.from(this.scripts.values()).filter(script => script.userId === userId);
  }

  async getScript(id: number): Promise<Script | undefined> {
    return this.scripts.get(id);
  }

  async createScript(insertScript: InsertScript): Promise<Script> {
    const id = this.currentScriptId++;
    const script: Script = { ...insertScript, id };
    this.scripts.set(id, script);
    return script;
  }

  async updateScript(id: number, updateData: Partial<InsertScript>): Promise<Script> {
    const existing = this.scripts.get(id);
    if (!existing) {
      throw new Error('Script not found');
    }
    const updated: Script = { ...existing, ...updateData };
    this.scripts.set(id, updated);
    return updated;
  }

  async deleteScript(id: number): Promise<void> {
    this.scripts.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  // User operations (required for authentication)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, customerId: string, subscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateUserSubscription(userId: string, tier: string, status: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        subscriptionTier: tier,
        subscriptionStatus: status,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  // Settings
  async getTeleprompterSettings(userId: string): Promise<TeleprompterSettings | undefined> {
    const [settings] = await db.select().from(teleprompterSettings).where(eq(teleprompterSettings.userId, userId));
    return settings || undefined;
  }

  async createTeleprompterSettings(insertSettings: InsertTeleprompterSettings): Promise<TeleprompterSettings> {
    const [settings] = await db
      .insert(teleprompterSettings)
      .values(insertSettings)
      .returning();
    return settings;
  }

  async updateTeleprompterSettings(userId: string, updateData: Partial<InsertTeleprompterSettings>): Promise<TeleprompterSettings> {
    const [settings] = await db
      .update(teleprompterSettings)
      .set(updateData)
      .where(eq(teleprompterSettings.userId, userId))
      .returning();
    
    if (!settings) {
      throw new Error('Settings not found');
    }
    return settings;
  }

  // Scripts
  async getScripts(userId: string): Promise<Script[]> {
    return await db.select().from(scripts).where(eq(scripts.userId, userId));
  }

  async getScript(id: number): Promise<Script | undefined> {
    const [script] = await db.select().from(scripts).where(eq(scripts.id, id));
    return script || undefined;
  }

  async createScript(insertScript: InsertScript): Promise<Script> {
    const [script] = await db
      .insert(scripts)
      .values(insertScript)
      .returning();
    return script;
  }

  async updateScript(id: number, updateData: Partial<InsertScript>): Promise<Script> {
    const [script] = await db
      .update(scripts)
      .set(updateData)
      .where(eq(scripts.id, id))
      .returning();
    
    if (!script) {
      throw new Error('Script not found');
    }
    return script;
  }

  async deleteScript(id: number): Promise<void> {
    await db.delete(scripts).where(eq(scripts.id, id));
  }

  // Usage tracking
  async logUsage(insertUsage: InsertUsageLog): Promise<UsageLog> {
    const [usage] = await db
      .insert(usageLogs)
      .values(insertUsage)
      .returning();
    return usage;
  }

  async getUserUsage(userId: string, feature?: string): Promise<number> {
    const query = db
      .select({ totalDuration: sum(usageLogs.duration) })
      .from(usageLogs)
      .where(eq(usageLogs.userId, userId));

    if (feature) {
      query.where(eq(usageLogs.feature, feature));
    }

    const [result] = await query;
    return Math.floor((result.totalDuration || 0) / 60); // Convert seconds to minutes
  }

  async canUseFeature(userId: string, feature: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    // Premium users have unlimited access
    if (user.subscriptionTier === 'premium') return true;

    // Pro users have access to voice input but not AI features
    if (user.subscriptionTier === 'pro') {
      return feature === 'voice_input';
    }

    // Free users get to try ALL premium features during their first 60 minutes
    if (user.subscriptionTier === 'free') {
      const totalUsage = await this.getUserUsage(userId);
      return totalUsage < 60; // 60 minutes grace period for all features
    }

    return false;
  }
}

export const storage = new DatabaseStorage();
