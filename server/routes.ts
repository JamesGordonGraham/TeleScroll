import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateScript, improveScript } from "./openai";
import { insertTeleprompterSettingsSchema, insertScriptSchema, insertUsageLogSchema } from "@shared/schema";
import mammoth from "mammoth";
import { z } from "zod";
import { JSDOM } from "jsdom";
import MarkdownIt from "markdown-it";
import { transcribeAudio } from "./speech";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

interface MulterRequest extends Request {
  file?: any;
}

// File upload for documents
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

// Audio upload for speech transcription
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for audio
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedAudioTypes = [
      'audio/webm',
      'audio/wav',
      'audio/mp3',
      'audio/mp4',
      'audio/mpeg',
      'audio/ogg'
    ];
    
    console.log('Audio file upload - mimetype:', file.mimetype, 'filename:', file.originalname);
    
    if (allowedAudioTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Supported audio formats: webm, wav, mp3, mp4, mpeg, ogg'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication middleware
  await setupAuth(app);

  // Authentication routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Subscription status route
  app.get('/api/subscription-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const usageLimit = user.subscriptionTier === 'free' ? 60 : null; // 60 minutes for free tier
      
      res.json({
        tier: user.subscriptionTier,
        status: user.subscriptionStatus,
        usage: user.usageMinutes,
        usageLimit,
      });
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      res.status(500).json({ message: "Failed to fetch subscription status" });
    }
  });

  // Subscription and billing routes
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const { priceId } = req.body;
    
    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }

    try {
      let user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // If user already has active subscription, return existing
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        if (subscription.status === 'active') {
          return res.json({
            subscriptionId: subscription.id,
            clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
          });
        }
      }

      let customerId = user.stripeCustomerId;
      
      // Create Stripe customer if doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : undefined,
          metadata: { userId: userId }
        });
        customerId = customer.id;
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with Stripe info
      await storage.updateUserStripeInfo(userId, customerId, subscription.id);
      
      // Update subscription tier based on price
      let tier = 'free';
      if (priceId.includes('pro')) tier = 'pro';
      if (priceId.includes('premium')) tier = 'premium';
      
      await storage.updateUserSubscription(userId, tier, subscription.status);

      res.json({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error('Subscription creation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get user subscription status
  app.get('/api/subscription-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const usage = await storage.getUserUsage(userId);
      
      res.json({
        tier: user.subscriptionTier,
        status: user.subscriptionStatus,
        usage: usage,
        usageLimit: user.subscriptionTier === 'free' ? 60 : null
      });
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      res.status(500).json({ error: 'Failed to fetch subscription status' });
    }
  });

  // AI Script Generation (Premium feature)
  app.post('/api/generate-script', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const canUse = await storage.canUseFeature(userId, 'ai_assistant');
      
      if (!canUse) {
        return res.status(403).json({ 
          error: 'AI Script Assistant requires Premium subscription',
          upgrade: true 
        });
      }

      const { scriptType, topic, duration, tone, audience, keyPoints, additionalInstructions } = req.body;
      
      if (!scriptType || !topic || !duration) {
        return res.status(400).json({ error: 'Missing required fields: scriptType, topic, duration' });
      }

      const script = await generateScript({
        scriptType,
        topic,
        duration,
        tone,
        audience,
        keyPoints,
        additionalInstructions
      });

      // Log usage
      await storage.logUsage({
        userId,
        feature: 'ai_assistant',
        duration: 0 // AI generation doesn't count towards time usage
      });

      res.json({ script });
    } catch (error: any) {
      console.error('Script generation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // AI Script Improvement (Premium feature)
  app.post('/api/improve-script', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const canUse = await storage.canUseFeature(userId, 'ai_assistant');
      
      if (!canUse) {
        return res.status(403).json({ 
          error: 'AI Script Assistant requires Premium subscription',
          upgrade: true 
        });
      }

      const { content, instructions } = req.body;
      
      if (!content || !instructions) {
        return res.status(400).json({ error: 'Missing required fields: content, instructions' });
      }

      const improvedScript = await improveScript(content, instructions);

      res.json({ script: improvedScript });
    } catch (error: any) {
      console.error('Script improvement error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get teleprompter settings
  app.get("/api/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.patch("/api/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.get("/api/scripts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const scripts = await storage.getScripts(userId);
      res.json(scripts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get scripts" });
    }
  });

  // Get specific script
  app.get("/api/scripts/:id", isAuthenticated, async (req: any, res) => {
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
  app.post("/api/scripts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.patch("/api/scripts/:id", isAuthenticated, async (req: any, res) => {
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
  app.delete("/api/scripts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteScript(id);
      res.json({ message: "Script deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete script" });
    }
  });

  // File upload endpoint
  app.post("/api/upload", isAuthenticated, upload.single('file'), async (req: MulterRequest, res) => {
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

  // Speech transcription endpoint with usage tracking
  app.post("/api/transcribe", isAuthenticated, audioUpload.single('audio'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if user can use voice input (Free users have 1 hour limit, Pro/Premium unlimited)
      const canUse = await storage.canUseFeature(userId, 'voice_input');
      if (!canUse) {
        return res.status(403).json({ 
          message: "You've reached the 1-hour limit for the Free plan. Upgrade to Pro for unlimited voice input.",
          upgrade: true
        });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No audio file provided" });
      }

      console.log('Received audio file:', req.file.originalname, 'Size:', req.file.size);
      const isInterim = req.body.interim === 'true';
      const startTime = Date.now();
      
      const result = await transcribeAudio(req.file.buffer, req.body.language || 'en-US');
      
      if (result.success) {
        // Log usage time (estimate 10 seconds per transcription)
        const duration = Math.max(10, Math.floor((Date.now() - startTime) / 1000));
        await storage.logUsage({
          userId,
          feature: 'voice_input',
          duration
        });

        res.json({ 
          transcript: result.transcript,
          confidence: result.confidence,
          interim: isInterim
        });
      } else {
        res.status(500).json({ 
          message: "Transcription failed", 
          error: result.error 
        });
      }
    } catch (error) {
      console.error('Transcription endpoint error:', error);
      res.status(500).json({ message: "Failed to transcribe audio" });
    }
  });

  // Test Google Speech API connectivity
  app.get("/api/speech/test", async (req, res) => {
    try {
      // Test with a simple empty audio buffer to check connectivity
      const testResult = await transcribeAudio(Buffer.alloc(0));
      res.json({ 
        status: "Google Speech API is configured", 
        hasCredentials: !!(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || process.env.GOOGLE_SPEECH_API_KEY)
      });
    } catch (error) {
      console.error('Speech API test error:', error);
      res.status(500).json({ 
        status: "Google Speech API configuration error", 
        error: error instanceof Error ? error.message : 'Unknown error',
        hasCredentials: !!(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || process.env.GOOGLE_SPEECH_API_KEY)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
