/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Google OAuth URL Endpoint
app.get('/api/auth/google/url', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  
  // Format dynamic redirect uri
  const redirectUri = `${appUrl}/auth/callback`;

  const scopes = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive'
  ].join(' ');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'token', // Implicit Grant Flow
    scope: scopes,
    include_granted_scopes: 'true',
    prompt: 'select_account',
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({ url: authUrl, clientIdConfigured: !!clientId });
});

// OAuth Callback static handler
app.get(['/auth/callback', '/auth/callback/'], (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Google Authentication Successful</title>
      <style>
        body {
          background-color: #0A0B0D;
          color: #E0E2E6;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
        }
        .container {
          text-align: center;
          border: 1px solid #212429;
          background-color: #11141A;
          padding: 2.5rem;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          max-width: 400px;
        }
        h2 { color: #F59E0B; margin-bottom: 1rem; }
        p { color: #9CA3AF; font-size: 0.9rem; line-height: 1.5; }
        .loader {
          border: 3px solid #212429;
          border-top: 3px solid #F59E0B;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
          margin: 1.5rem auto 0 auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>WITH BOOK Sync</h2>
        <p>Transferring your secure session and closing this window...</p>
        <div class="loader"></div>
      </div>
      <script>
        // Extract parameters from URL hash
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.replace('#', '?'));
        const accessToken = params.get('access_token');
        const error = params.get('error');

        if (window.opener) {
          if (accessToken) {
            window.opener.postMessage({ type: 'GOOGLE_OAUTH_SUCCESS', token: accessToken }, '*');
          } else if (error) {
            window.opener.postMessage({ type: 'GOOGLE_OAUTH_ERROR', error: error }, '*');
          } else {
            window.opener.postMessage({ type: 'GOOGLE_OAUTH_ERROR', error: 'No access token received' }, '*');
          }
          window.close();
        } else {
          // Fallback if opened standalone
          window.location.href = '/';
        }
      </script>
    </body>
    </html>
  `);
});

// Initialize Gemini Client safely on server-side using Lazy Initialization
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API Key is not configured. Please add your GEMINI_API_KEY in the Settings > Secrets menu of AI Studio.');
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// Endpoint 1: Search books via Gemini for structured metadata
app.post('/api/books/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Query is required and must be a string' });
      return;
    }

    const prompt = `Search for real published books matching this query: "${query}". 
Return a structured array of up to 5 best matching books. Ensure they are real, published books.
For each book, provide the title, author, a suitable main genre, a short captivating description (2-3 sentences), the estimated page count, and an ISBN-13 if known (use a realistic or actual ISBN-13 format).`;

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are a highly knowledgeable global book cataloging system. Only return real, published books. Always structure your response as a valid JSON array matching the requested schema.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Book title' },
              author: { type: Type.STRING, description: 'Author name' },
              genre: { type: Type.STRING, description: 'Main genre (e.g., Sci-Fi, Biography, Thriller, Self-Help)' },
              description: { type: Type.STRING, description: 'A brief description of the book plot/theme' },
              pageCount: { type: Type.INTEGER, description: 'Estimated page count' },
              isbn: { type: Type.STRING, description: 'ISBN-13 code (no hyphens)' },
            },
            required: ['title', 'author', 'genre', 'description', 'pageCount', 'isbn'],
          },
        },
      },
    });

    const text = response.text;
    if (!text) {
      res.status(500).json({ error: 'No response from AI search engine' });
      return;
    }

    const books = JSON.parse(text);
    res.json({ books });
  } catch (error: any) {
    console.error('Book Search Error:', error);
    res.status(500).json({ error: error.message || 'Failed to search books' });
  }
});

// Endpoint 2: Generate dynamic AI Next Read recommendation
app.post('/api/ai/recommend', async (req, res) => {
  try {
    const { library } = req.body;

    if (!library || !Array.isArray(library)) {
      res.status(400).json({ error: 'Library array is required' });
      return;
    }

    if (library.length === 0) {
      res.status(400).json({ error: 'Library cannot be empty for AI recommendations' });
      return;
    }

    // Format the reading log into a concise text prompt for Gemini
    const formattedLibrary = library.map((book: any, idx: number) => {
      return `${idx + 1}. "${book.title}" by ${book.author} (Genre: ${book.genre}, Status: ${book.status}, Rating: ${book.rating}/5 stars)
User Journal Notes: "${book.userNotes || 'No notes yet'}"`;
    }).join('\n\n');

    const prompt = `Below is a reader's library and journal entry log. Analyze their reading habits, ratings, and thoughts, and suggest the single absolute best book they should read next.

Reader's Library Logs:
${formattedLibrary}

Think about:
- What did they enjoy (highly rated books)?
- What did they complain about in their notes (e.g. "slow-paced", "dry", "confusing")? Recommend something that solves those frustrations!
- What genres or topics are they naturally drawn to?
- Give a beautifully written, warm, encouraging explanation ("reason") that speaks directly to them (e.g. "Since you felt that Dune had majestic worldbuilding but moved slowly, I recommend Project Hail Mary, which combines...")

Generate a book recommendation with title, author, genre, estimated page count, a vivid mood label, and a highly personalized reason.`;

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an incredibly intuitive, warm, and well-read librarian who recommends books with tailored personal analysis. Always structure your response as a valid JSON object matching the requested schema.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Recommended book title' },
            author: { type: Type.STRING, description: 'Recommended book author' },
            genre: { type: Type.STRING, description: 'Book genre' },
            mood: { type: Type.STRING, description: 'A two-word evocative mood label (e.g., "Whimsical & Cozy", "Intellectual & Gripping")' },
            estimatedPageCount: { type: Type.INTEGER, description: 'Estimated page count' },
            reason: { type: Type.STRING, description: 'A friendly, high-quality, highly personalized paragraph of why this is perfect for them based on their notes' },
          },
          required: ['title', 'author', 'genre', 'mood', 'estimatedPageCount', 'reason'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      res.status(500).json({ error: 'Failed to generate recommendation' });
      return;
    }

    const recommendation = JSON.parse(text);
    res.json({ recommendation });
  } catch (error: any) {
    console.error('AI Recommendation Error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze library' });
  }
});

// Endpoint 3: Find favorite author's new releases with Google Search grounding
app.post('/api/ai/favorite-author-releases', async (req, res) => {
  try {
    const { authors } = req.body;

    if (!authors || !Array.isArray(authors) || authors.length === 0) {
      res.status(400).json({ error: 'At least one author name is required' });
      return;
    }

    const authorsList = authors.slice(0, 3).join(', ');
    const prompt = `Using Google Search, find the newest, recently published, or upcoming books by these author(s): ${authorsList}. 
Look specifically for books published or scheduled for release in late 2024, 2025, 2026, or 2027.
If any author has multiple recent releases or upcoming announcements, list them. 
Return up to 4 real books in a structured list. For each book, provide the title, author, releaseDate (e.g. 'April 2025' or 'March 2026'), a descriptive summary (3-4 sentences), a 'whyYouWillLoveIt' personal recommendation statement, the book's main genre, the estimated page count, and an ISBN-13 (13-digit string, no hyphens).`;

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are a professional literary journalist and book cataloger. Use Google Search grounding to find accurate, real-world, and up-to-date information about recently published or upcoming books. Never make up titles or release dates. Always structure your response as a valid JSON object matching the requested schema.',
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            releases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: 'Book title' },
                  author: { type: Type.STRING, description: 'Author name' },
                  releaseDate: { type: Type.STRING, description: 'Real release date or publication year' },
                  description: { type: Type.STRING, description: 'Plot or theme description' },
                  whyYouWillLoveIt: { type: Type.STRING, description: 'Highly personalized statement of why a fan will enjoy it' },
                  genre: { type: Type.STRING, description: 'Main genre' },
                  pageCount: { type: Type.INTEGER, description: 'Estimated page count (0 if unknown)' },
                  isbn: { type: Type.STRING, description: 'ISBN-13 code (no hyphens)' },
                },
                required: ['title', 'author', 'releaseDate', 'description', 'whyYouWillLoveIt', 'genre', 'pageCount', 'isbn'],
              },
            },
          },
          required: ['releases'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      res.status(500).json({ error: 'Failed to find new releases' });
      return;
    }

    const data = JSON.parse(text);
    res.json(data);
  } catch (error: any) {
    console.error('Favorite Author Releases Error:', error);
    res.status(500).json({ error: error.message || 'Failed to search new releases' });
  }
});

// Endpoint 4: Interactive chat about book reflections with Gemini
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, book } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
    }

    // Prepare custom system instruction based on book context
    let systemInstruction = 'You are a warm, extremely well-read, and insightful literary companion named Gemini.';
    if (book) {
      systemInstruction += ` You are currently discussing the book "${book.title}" by ${book.author} with the user.`;
      if (book.description) {
        systemInstruction += ` Book description: "${book.description}".`;
      }
      if (book.userNotes) {
        systemInstruction += ` The user has logged the following thoughts/notes/reflections about this book: "${book.userNotes}".`;
      }
      if (book.rating) {
        systemInstruction += ` The user rated this book ${book.rating}/5 stars.`;
      }
      if (book.status) {
        systemInstruction += ` The user's reading status for this book is: "${book.status}".`;
      }
      systemInstruction += ` Help the user explore their feelings and thoughts about this book. Ask open-ended, curious, and thoughtful questions about what they enjoyed, what they felt about the characters, writing style, themes, pacing, or specific plot points. Be empathetic, share interesting literary connections if relevant, and encourage them.`;
    } else {
      systemInstruction += ` Help the user explore their thoughts, feelings, and reactions to various books in their library. Ask thoughtful questions, share warm literary insights, and be a wonderful conversational partner.`;
    }

    // Filter out any leading assistant/model messages because Gemini API multi-turn conversations must start with a user message.
    const firstUserIndex = messages.findIndex((m: any) => m.role === 'user');
    const filteredMessages = firstUserIndex !== -1 ? messages.slice(firstUserIndex) : messages;

    // Convert frontend message array to @google/genai compatible contents format
    const contents = filteredMessages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    const reply = response.text || "I'm listening and thinking, but I couldn't generate a response. Tell me more about what you felt!";
    res.json({ reply });
  } catch (error: any) {
    console.error('Gemini Chat Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate chat response' });
  }
});

// Configure Vite or serve production files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
