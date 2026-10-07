import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Initialize Gemini with the server-side environment key
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey ? new GoogleGenAI({ 
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  }) : null;

  // Endpoint for Gemini Voice/Chat turn
  app.post('/api/gemini/voice', async (req, res) => {
    try {
      const { message, targetName, targetEmail, history } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      if (!ai) {
        return res.status(500).json({ 
          error: 'Gemini API key is not configured on the server. Please set the GEMINI_API_KEY environment variable in AI Studio Secrets.' 
        });
      }

      // Voice Assistant Tools Definitions
      const voiceAssistantTools = [
        {
          name: "getMySchedule",
          description: `Fetches current tasks, pending deadlines, and schedule from Tasky for ${targetName || 'the user'}.`,
          parameters: {
            type: Type.OBJECT,
            properties: {
              filter: { type: Type.STRING, description: "Filter option: 'today', 'pending', 'urgent', or 'all'" }
            }
          }
        },
        {
          name: "createTask",
          description: "Adds a new task to Tasky when the user asks.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Title of the task" },
              description: { type: Type.STRING, description: "Optional notes or details" },
              dueDate: { type: Type.STRING, description: "Due date in YYYY-MM-DD format" },
              priority: { type: Type.STRING, description: "'Low', 'Medium', 'High', or 'Urgent'" }
            },
            required: ["title"]
          }
        },
        {
          name: "updateTaskStatus",
          description: "Updates a task status (e.g. marks as Completed).",
          parameters: {
            type: Type.OBJECT,
            properties: {
              taskId: { type: Type.STRING, description: "The task ID" },
              status: { type: Type.STRING, description: "'Completed', 'InProgress', or 'Todo'" }
            },
            required: ["taskId", "status"]
          }
        }
      ];

      const contents: any[] = [];
      if (history && Array.isArray(history)) {
        contents.push(...history);
      }
      contents.push({ role: 'user', parts: [{ text: message }] });

      // We use the modern gemini-3.8-flash model
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents,
        config: {
          systemInstruction: `You are the friendly and conversational Tasky Voice & Chat Assistant for ${targetName || 'Elias Georgiou'} (${targetEmail || 'spidereg2010@gmail.com'}). Use your tools to read the schedule, create new tasks, or update task statuses when asked. Be concise, warm, and helpful. Always respond in the language the user speaks to you (e.g. Greek if they speak Greek, English if they speak English).`,
          tools: [{ functionDeclarations: voiceAssistantTools }]
        }
      });

      // Check for function calls requested by the model
      if (response.functionCalls && response.functionCalls.length > 0) {
        return res.json({
          text: response.text || "",
          functionCalls: response.functionCalls
        });
      }

      return res.json({
        text: response.text || ""
      });
    } catch (err: any) {
      console.error("Gemini server error:", err);
      return res.status(500).json({ error: err.message || 'Failed to communicate with Gemini API' });
    }
  });

  // Serve static files in production or hook Vite in development
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });
    app.use(vite.middlewares);
    
    // Serve index.html dynamically
    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // Production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
