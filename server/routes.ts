import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { insertTeleprompterSettingsSchema, insertScriptSchema } from "@shared/schema";
import mammoth from "mammoth";
import { z } from "zod";

interface MulterRequest extends Request {
  file?: any;
}

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype === 'text/plain' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only .txt and .docx files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  const userId = "default-user"; // For this demo, using a default user

  // Get teleprompter settings
  app.get("/api/settings", async (req, res) => {
    try {
      let settings = await storage.getTeleprompterSettings(userId);
      if (!settings) {
        // Create default settings if none exist
        settings = await storage.createTeleprompterSettings({
          userId,
          fontSize: 32,
          lineHeight: 1.6,
          scrollSpeed: 1.0,
          smoothScrolling: true,
          autoFullscreen: false,
          hideCursor: true,
        });
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get settings" });
    }
  });

  // Update teleprompter settings
  app.patch("/api/settings", async (req, res) => {
    try {
      const updateData = insertTeleprompterSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateTeleprompterSettings(userId, updateData);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid settings data" });
      } else {
        res.status(500).json({ message: "Failed to update settings" });
      }
    }
  });

  // Get all scripts
  app.get("/api/scripts", async (req, res) => {
    try {
      const scripts = await storage.getScripts(userId);
      res.json(scripts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get scripts" });
    }
  });

  // Get specific script
  app.get("/api/scripts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const script = await storage.getScript(id);
      if (!script) {
        return res.status(404).json({ message: "Script not found" });
      }
      res.json(script);
    } catch (error) {
      res.status(500).json({ message: "Failed to get script" });
    }
  });

  // Create script
  app.post("/api/scripts", async (req, res) => {
    try {
      const scriptData = insertScriptSchema.parse({ ...req.body, userId });
      const script = await storage.createScript(scriptData);
      res.json(script);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid script data" });
      } else {
        res.status(500).json({ message: "Failed to create script" });
      }
    }
  });

  // Update script
  app.patch("/api/scripts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertScriptSchema.partial().parse(req.body);
      const script = await storage.updateScript(id, updateData);
      res.json(script);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid script data" });
      } else {
        res.status(500).json({ message: "Failed to update script" });
      }
    }
  });

  // Delete script
  app.delete("/api/scripts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteScript(id);
      res.json({ message: "Script deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete script" });
    }
  });

  // File upload endpoint
  app.post("/api/upload", upload.single('file'), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      let content = '';
      
      if (req.file.mimetype === 'text/plain') {
        content = req.file.buffer.toString('utf8');
      } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        content = result.value;
      } else {
        return res.status(400).json({ message: "Unsupported file type" });
      }

      res.json({ content, filename: req.file.originalname });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ message: "Failed to process file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
