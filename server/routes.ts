import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { insertTeleprompterSettingsSchema, insertScriptSchema } from "@shared/schema";
import mammoth from "mammoth";
import { z } from "zod";
// import pdf from "pdf-parse";
import { JSDOM } from "jsdom";
import MarkdownIt from "markdown-it";

interface MulterRequest extends Request {
  file?: any;
}

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = [
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/rtf',
      'text/rtf',
      'text/html',
      'text/markdown'
    ];
    
    const allowedExtensions = ['.txt', '.doc', '.docx', '.rtf', '.html', '.htm', '.md'];
    const fileExtension = '.' + file.originalname.split('.').pop()?.toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Supported formats: .txt, .doc, .docx, .rtf, .html, .htm, .md'));
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
          textWidth: 80,
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
      const filename = req.file.originalname;
      const fileExtension = '.' + filename.split('.').pop()?.toLowerCase();

      // Text files
      if (req.file.mimetype === 'text/plain' || fileExtension === '.txt') {
        content = req.file.buffer.toString('utf-8');
      }
      // Word documents (.docx)
      else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileExtension === '.docx') {
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        content = result.value;
      }
      // Legacy Word documents (.doc) - basic text extraction
      else if (req.file.mimetype === 'application/msword' || fileExtension === '.doc') {
        // Simple text extraction for .doc files (binary format is complex)
        content = req.file.buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r]/g, ' ').replace(/\s+/g, ' ').trim();
      }
      // RTF files
      else if (req.file.mimetype === 'application/rtf' || req.file.mimetype === 'text/rtf' || fileExtension === '.rtf') {
        // Basic RTF parsing - strip RTF commands
        const rtfContent = req.file.buffer.toString('utf-8');
        content = rtfContent.replace(/\\[a-z0-9]+\s?/gi, '').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
      }
      // PDF files
      else if (req.file.mimetype === 'application/pdf' || fileExtension === '.pdf') {
        // PDF support temporarily disabled due to library issue
        return res.status(400).json({ message: "PDF support is currently unavailable. Please use .txt, .docx, .html, or .md files instead." });
      }
      // HTML files
      else if (req.file.mimetype === 'text/html' || fileExtension === '.html' || fileExtension === '.htm') {
        const htmlContent = req.file.buffer.toString('utf-8');
        const dom = new JSDOM(htmlContent);
        content = dom.window.document.body?.textContent || dom.window.document.textContent || '';
      }
      // Markdown files
      else if (req.file.mimetype === 'text/markdown' || fileExtension === '.md') {
        const markdownContent = req.file.buffer.toString('utf-8');
        const md = new MarkdownIt();
        const htmlResult = md.render(markdownContent);
        const dom = new JSDOM(htmlResult);
        content = dom.window.document.body?.textContent || markdownContent;
      }
      else {
        return res.status(400).json({ message: "Unsupported file format" });
      }

      // Clean up the content
      content = content.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      res.json({ content, filename });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ message: "Failed to process file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
