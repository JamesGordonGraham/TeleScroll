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
import speech from "@google-cloud/speech";
import { WebSocketServer, WebSocket } from "ws";

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

// Separate multer configuration for audio files
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for audio
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedAudioTypes = [
      'audio/webm',
      'audio/ogg',
      'audio/wav',
      'audio/mp3',
      'audio/mpeg',
      'audio/mp4',
      'audio/x-wav'
    ];
    
    const allowedAudioExtensions = ['.webm', '.ogg', '.wav', '.mp3', '.m4a'];
    const fileExtension = '.' + file.originalname.split('.').pop()?.toLowerCase();
    
    if (allowedAudioTypes.includes(file.mimetype) || allowedAudioExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Supported audio formats: .webm, .ogg, .wav, .mp3, .m4a'));
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

  // Speech-to-text endpoint
  app.post("/api/speech-to-text", audioUpload.single('audio'), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No audio file uploaded" });
      }

      // Initialize Google Speech client
      const client = new speech.SpeechClient({
        apiKey: process.env.GOOGLE_SPEECH_API_KEY,
      });

      const audio = {
        content: req.file.buffer.toString('base64'),
      };

      const config = {
        encoding: 'WEBM_OPUS' as const,
        sampleRateHertz: 48000,
        languageCode: 'en-US',
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: false,
        model: 'latest_long',
      };

      const request = {
        audio: audio,
        config: config,
      };

      const [response] = await client.recognize(request);
      const transcription = response.results
        ?.map((result) => result.alternatives?.[0]?.transcript)
        .filter(Boolean)
        .join(' ') || '';

      res.json({ transcription });
    } catch (error) {
      console.error('Speech-to-text error:', error);
      res.status(500).json({ message: "Failed to transcribe audio" });
    }
  });

  const httpServer = createServer(app);
  
  // WebSocket server for real-time speech-to-text
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/speech' });
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('Speech WebSocket client connected');
    
    let speechClient: speech.SpeechClient | null = null;
    let recognizeStream: any = null;
    
    ws.on('message', async (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'start') {
          // Initialize speech client and streaming recognition
          speechClient = new speech.SpeechClient({
            apiKey: process.env.GOOGLE_SPEECH_API_KEY,
          });
          
          const request = {
            config: {
              encoding: 'LINEAR16' as const,
              sampleRateHertz: 16000,
              languageCode: 'en-US',
              enableAutomaticPunctuation: true,
              enableWordTimeOffsets: false,
              model: 'latest_short',
            },
            interimResults: true,
          };
          
          recognizeStream = speechClient
            .streamingRecognize(request)
            .on('data', (data: any) => {
              if (data.results[0] && data.results[0].alternatives[0]) {
                const transcript = data.results[0].alternatives[0].transcript;
                const isFinal = data.results[0].isFinal;
                
                ws.send(JSON.stringify({
                  type: 'transcript',
                  text: transcript,
                  isFinal: isFinal
                }));
              }
            })
            .on('error', (error: any) => {
              console.error('Streaming recognition error:', error);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Speech recognition error'
              }));
            });
          
        } else if (data.type === 'audio') {
          // Send audio data to the stream
          if (recognizeStream && !recognizeStream.destroyed) {
            const audioBuffer = Buffer.from(data.audio, 'base64');
            recognizeStream.write(audioBuffer);
          }
        } else if (data.type === 'stop') {
          // End the recognition stream
          if (recognizeStream && !recognizeStream.destroyed) {
            recognizeStream.end();
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('Speech WebSocket client disconnected');
      if (recognizeStream && !recognizeStream.destroyed) {
        recognizeStream.end();
      }
    });
  });
  
  return httpServer;
}
