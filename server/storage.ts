import { teleprompterSettings, scripts, type TeleprompterSettings, type InsertTeleprompterSettings, type Script, type InsertScript } from "@shared/schema";

export interface IStorage {
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
      lineHeight: insertSettings.lineHeight ?? 1.6,
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

export const storage = new MemStorage();
