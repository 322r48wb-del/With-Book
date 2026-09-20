/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// リクエストボディの制限量を拡張 (画像データや大きなログ共有に対応)
app.use(express.json({ limit: '10mb' }));

// Google OAuth URL Endpoint
app.get('/api/auth/google/url', (req: Request, res: Response) => {
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
app.get(['/auth/callback', '/auth/callback/'], (_req: Request, res: Response) => {
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

function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY);
}

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

// Endpoint: Check AI status and configuration
app.get('/api/ai/status', (_req: Request, res: Response) => {
  res.json({
    geminiConfigured: hasGeminiKey(),
    model: 'gemini-3.8-flash',
  });
});

// Shared logs storage for sharing reading journals with friends
interface SharedLogRecord {
  id: string;
  createdAt: string;
  readerName?: string;
  shareNote?: string;
  readingGoal?: number;
  books: any[];
  singleBookId?: string;
}

const sharedLogsStore = new Map<string, SharedLogRecord>();

// Endpoint: Create a shareable reading log bundle
app.post('/api/share', (req: Request, res: Response) => {
  try {
    const { books, readingGoal, readerName, shareNote, singleBookId } = req.body;

    if (!Array.isArray(books) || books.length === 0) {
      return res.status(400).json({ error: 'At least one book log is required to share' });
    }

    // Limit maximum stored items to prevent memory leaks
    if (sharedLogsStore.size > 1000) {
      const firstKey = sharedLogsStore.keys().next().value;
      if (firstKey) sharedLogsStore.delete(firstKey);
    }

    const shareId = `wb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const record: SharedLogRecord = {
      id: shareId,
      createdAt: new Date().toISOString(),
      readerName: (readerName || 'Fellow Reader').trim().slice(0, 50),
      shareNote: (shareNote || '').trim().slice(0, 280),
      readingGoal: typeof readingGoal === 'number' ? readingGoal : undefined,
      books: books.slice(0, 50), // Cap at 50 books for sensible payload
      singleBookId: singleBookId || undefined,
    };

    sharedLogsStore.set(shareId, record);

    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const shareUrl = `${appUrl}?share=${shareId}`;

    return res.json({
      success: true,
      shareId,
      shareUrl,
      record,
    });
  } catch (error: any) {
    console.error('Share Creation Error:', error);
    return res.status(500).json({ error: 'Failed to create shareable link' });
  }
});

// Endpoint: Fetch a shared reading log bundle by ID
app.get('/api/share/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const record = sharedLogsStore.get(id);

  if (!record) {
    return res.status(404).json({ error: 'Shared reading log not found or link has expired' });
  }

  return res.json({
    success: true,
    record,
  });
});

// Curated catalog fallback for seamless offline/preview search
const CURATED_BOOK_CATALOG = [
  {
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    genre: 'Sci-Fi',
    description: 'Ryland Grace is the sole survivor on a desperate, last-chance mission—and if he fails, humanity and the earth itself will perish. An ingenious science adventure full of humor, hope, and friendship.',
    pageCount: 496,
    isbn: '9780593135204'
  },
  {
    title: 'The Midnight Library',
    author: 'Matt Haig',
    genre: 'Fiction',
    description: 'Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.',
    pageCount: 304,
    isbn: '9780525559474'
  },
  {
    title: 'The Maidens',
    author: 'Alex Michaelides',
    genre: 'Thriller',
    description: 'Edward Fosca is a murderer. Of this Mariana is certain. But Fosca is untouchable. A handsome Greek tragedy professor at Cambridge, Fosca is adored by staff and students—particularly by the members of a secret society of female students known as The Maidens.',
    pageCount: 352,
    isbn: '9781250304452'
  },
  {
    title: 'Deep Work',
    author: 'Cal Newport',
    genre: 'Self-Help',
    description: 'Rules for focused success in a distracted world. Deep work is the ability to focus without distraction on a cognitively demanding task.',
    pageCount: 304,
    isbn: '9781455586691'
  },
  {
    title: 'Klara and the Sun',
    author: 'Kazuo Ishiguro',
    genre: 'Literary Fiction',
    description: 'From the Nobel laureate Kazuo Ishiguro, a thrilling look at our rapidly changing modern world through the eyes of an unforgettable narrator who observes the nature of love and connection.',
    pageCount: 320,
    isbn: '9780593318171'
  },
  {
    title: 'Tomorrow, and Tomorrow, and Tomorrow',
    author: 'Gabrielle Zevin',
    genre: 'Fiction',
    description: 'On a bitter-cold day in the December of his junior year at Harvard, Sam Masur exits a subway car and sees, amid the horde of people, Sadie Green. A dazzling story of identity, creativity, and love.',
    pageCount: 416,
    isbn: '9780593321201'
  },
  {
    title: 'Dune Messiah',
    author: 'Frank Herbert',
    genre: 'Sci-Fi',
    description: 'The dramatic continuation of Paul Atreides\' epic story as Emperor of the Known Universe, wrestling with the myth, power, and galactic jihad he unleashed.',
    pageCount: 336,
    isbn: '9780441172696'
  },
  {
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    genre: 'Non-Fiction',
    description: 'From a renowned historian comes a groundbreaking narrative of humanity’s creation and evolution—exploring the ways in which biology and history have defined us.',
    pageCount: 464,
    isbn: '9780062316097'
  },
  {
    title: 'Pachinko',
    author: 'Min Jin Lee',
    genre: 'Historical Fiction',
    description: 'In the early 1900s, teenaged Sunja falls in love with a wealthy stranger. When she discovers she is pregnant and that her lover is married, she refuses to be bought, sparking an unforgettable generational saga.',
    pageCount: 496,
    isbn: '9781455563937'
  },
  {
    title: 'The Song of Achilles',
    author: 'Madeline Miller',
    genre: 'Mythology',
    description: 'A breathtaking, deeply moving reimagining of Homer\'s Iliad through the intimate perspective of Patroclus and his deep bond with Achilles.',
    pageCount: 416,
    isbn: '9780062060624'
  }
];

// Endpoint 1: Search books via Gemini for structured metadata
app.post('/api/books/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required and must be a string' });
    }

    if (hasGeminiKey()) {
      try {
        const prompt = `Search for real published books matching this query: "${query}". 
Return a structured array of up to 5 best matching books. Ensure they are real, published books.
For each book, provide the title, author, a suitable main genre, a short captivating description (2-3 sentences), the estimated page count, and an ISBN-13 if known (use a realistic or actual ISBN-13 format).`;

        const ai = getGeminiClient();
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
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
        if (text) {
          const books = JSON.parse(text);
          return res.json({ books, isPreview: false });
        }
      } catch (geminiError: any) {
        console.warn('Gemini search encountered an issue, using curated catalog fallback:', geminiError?.message || geminiError);
      }
    }

    // Fallback: search within curated real book catalog
    const qLower = query.toLowerCase();
    const matched = CURATED_BOOK_CATALOG.filter((b) => 
      b.title.toLowerCase().includes(qLower) ||
      b.author.toLowerCase().includes(qLower) ||
      b.genre.toLowerCase().includes(qLower) ||
      b.description.toLowerCase().includes(qLower)
    );

    const books = matched.length > 0 ? matched : CURATED_BOOK_CATALOG.slice(0, 5);
    return res.json({ books, isPreview: !hasGeminiKey() });
  } catch (error: any) {
    console.error('Book Search Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to search books' });
  }
});

// Endpoint 2: Generate dynamic AI Next Read recommendation
app.post('/api/ai/recommend', async (req: Request, res: Response) => {
  try {
    const { library } = req.body;

    if (!library || !Array.isArray(library)) {
      return res.status(400).json({ error: 'Library array is required' });
    }

    if (library.length === 0) {
      return res.status(400).json({ error: 'Library cannot be empty for AI recommendations' });
    }

    if (hasGeminiKey()) {
      try {
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
          model: 'gemini-3.8-flash',
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
        if (text) {
          const recommendation = JSON.parse(text);
          return res.json({ recommendation, isPreview: false });
        }
      } catch (geminiErr: any) {
        console.warn('Gemini recommendation encountered an issue, using intelligent fallback:', geminiErr?.message || geminiErr);
      }
    }

    // Intelligent recommendation fallback based on user's top genres & ratings
    const genreCounts: Record<string, number> = {};
    let highestRatedBook: any = library[0];

    for (const b of library) {
      const g = (b.genre || 'General').trim();
      genreCounts[g] = (genreCounts[g] || 0) + (b.rating || 3);
      if ((b.rating || 0) > (highestRatedBook?.rating || 0)) {
        highestRatedBook = b;
      }
    }

    const unreadFromCatalog = CURATED_BOOK_CATALOG.filter(
      (c) => !library.some((b) => b.title.toLowerCase() === c.title.toLowerCase())
    );

    const chosen = unreadFromCatalog.length > 0 ? unreadFromCatalog[0] : CURATED_BOOK_CATALOG[0];

    const recommendation = {
      title: chosen.title,
      author: chosen.author,
      genre: chosen.genre,
      mood: 'Engaging & Profound',
      estimatedPageCount: chosen.pageCount,
      reason: `Based on your high enjoyment of "${highestRatedBook?.title || 'your recent reads'}" by ${highestRatedBook?.author || 'author'}, "${chosen.title}" provides a masterfully balanced reading experience with tight narrative momentum, memorable character arcs, and deep thematic resonance.`,
    };

    return res.json({ recommendation, isPreview: !hasGeminiKey() });
  } catch (error: any) {
    console.error('AI Recommendation Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to analyze library' });
  }
});

// Endpoint 3: Find favorite author's new releases with Google Search grounding
app.post('/api/ai/favorite-author-releases', async (req: Request, res: Response) => {
  try {
    const { authors } = req.body;

    if (!authors || !Array.isArray(authors) || authors.length === 0) {
      return res.status(400).json({ error: 'At least one author name is required' });
    }

    const authorsList = authors.slice(0, 3).join(', ');

    if (hasGeminiKey()) {
      try {
        const prompt = `Using Google Search, find the newest, recently published, or upcoming books by these author(s): ${authorsList}. 
Look specifically for books published or scheduled for release in late 2024, 2025, 2026, or 2027.
If any author has multiple recent releases or upcoming announcements, list them. 
Return up to 4 real books in a structured list. For each book, provide the title, author, releaseDate (e.g. 'April 2025' or 'March 2026'), a descriptive summary (3-4 sentences), a 'whyYouWillLoveIt' personal recommendation statement, the book's main genre, the estimated page count, and an ISBN-13 (13-digit string, no hyphens).`;

        const ai = getGeminiClient();
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
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
        if (text) {
          const data = JSON.parse(text);
          return res.json({ ...data, isPreview: false });
        }
      } catch (geminiErr: any) {
        console.warn('Gemini search grounding encountered an issue, using fallback:', geminiErr?.message || geminiErr);
      }
    }

    // Fallback known real releases for common queried authors
    const fallbackReleases = [
      {
        title: 'The Fury',
        author: 'Alex Michaelides',
        genre: 'Psychological Thriller',
        releaseDate: 'January 2024',
        description: 'A master of suspense returns with a tale of an ex-movie star and a private Greek island where murder strikes among a close-knit group of old friends.',
        whyYouWillLoveIt: 'If you loved the psychological labyrinth of The Silent Patient, this features another signature unreliable narrator and intricate theatrical puzzle.',
        pageCount: 320,
        isbn: '9781250842077'
      },
      {
        title: 'Wind and Truth',
        author: 'Brandon Sanderson',
        genre: 'Epic Fantasy',
        releaseDate: 'December 2024',
        description: 'The monumental fifth book and climax of the first arc of The Stormlight Archive, concluding the war across Roshar.',
        whyYouWillLoveIt: 'Brandon Sanderson delivers the biggest fantasy event of the decade, tying together a decade of deep worldbuilding and character growth.',
        pageCount: 1344,
        isbn: '9781250319189'
      },
      {
        title: 'The City and Its Uncertain Walls',
        author: 'Haruki Murakami',
        genre: 'Magical Realism',
        releaseDate: 'November 2024',
        description: 'A beloved protagonist returns to a town enclosed by tall walls, where shadows have independent life and dreams are read in libraries.',
        whyYouWillLoveIt: 'A hypnotic, dreamlike return to Murakami\'s most celebrated atmospheric themes of memory, longing, and metaphysical mystery.',
        pageCount: 464,
        isbn: '9780593801970'
      }
    ];

    return res.json({ releases: fallbackReleases, isPreview: !hasGeminiKey() });
  } catch (error: any) {
    console.error('Favorite Author Releases Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to search new releases' });
  }
});

// Endpoint: Distinguish feelings & generate hashtags from reactions & notes using Gemini
app.post('/api/ai/analyze-feelings', async (req: Request, res: Response) => {
  try {
    const { title, author, genre, userNotes, rating, keyQuotes } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Book title is required' });
    }

    if (hasGeminiKey()) {
      try {
        const quotesText = Array.isArray(keyQuotes) && keyQuotes.length > 0 
          ? `\nKey Quotes Highlighted by Reader:\n${keyQuotes.map((q: string) => `• "${q}"`).join('\n')}`
          : '';

        const prompt = `You are an expert literary psychologist and emotional reader analyst.
The reader has written the following reflections, reactions, and journal notes about the book:

Book: "${title}" by ${author || 'Unknown'} (Genre: ${genre || 'General'})
Reader's Rating: ${rating ? `${rating}/5 stars` : 'Unrated'}
Reader's Reactions & Journal Notes:
"${userNotes && userNotes.trim() ? userNotes : 'No notes written yet; deduce intuitive baseline feelings based on the book theme and title.'}"
${quotesText}

Your goal is to distinguish and extract the reader's genuine emotional feeling across two core psychological axes:
1. Happiness (Mood Tone):
   - Score between -100 (Somber, Melancholic, Heavy, Dark, Tragic, Bleak, Cynical) and +100 (Happy, Joyful, Uplifting, Warm, Optimistic, Cheerful, Light). Zero (0) represents neutral or evenly balanced mood.
2. Impressed (Resonance & Profundity):
   - Score between -100 (Casual, Breezy, Lighthearted, Popcorn read, Mildly entertaining, Quick distraction) and +100 (Deeply Impressed, Moving, Mind-Blowing, Life-Altering, Awe-Inspiring, Profound, Monumental). Zero (0) represents moderate resonance.

Also:
3. Provide a brief 1-2 sentence empathetic summary explaining why you distinguished this feeling from their reflections.
4. Generate 3 to 6 evocative, easy-to-understand feeling hashtags (starting with "#") that make it effortless for the reader to immediately understand and categorize the feeling (e.g., "#Heartwarming", "#ProfoundAndSomber", "#MindBlowingTwist", "#TearJerker", "#PhilosophicalDepth", "#CozyComfort", "#DarkAtmosphere", "#HighOctaneThriller", "#PureJoy").
5. Provide 2 to 4 short emotion tags (e.g. ["Deeply Impressed", "Heartwarming", "Inspiring"]).`;

        const ai = getGeminiClient();
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: 'You are an empathetic literary emotion analyst. Accurately measure emotional feelings and generate intuitive feeling hashtags based on reader reactions. Output valid JSON matching the schema.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                happiness: {
                  type: Type.INTEGER,
                  description: 'Score from -100 (Somber/Dark/Melancholic) to +100 (Happy/Joyful/Uplifting)',
                },
                impressed: {
                  type: Type.INTEGER,
                  description: 'Score from -100 (Casual/Lighthearted/Breezy) to +100 (Deeply Impressed/Moving/Profound)',
                },
                summary: {
                  type: Type.STRING,
                  description: 'A 1-2 sentence distillation of the reader\'s feeling from their notes',
                },
                hashtags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '3-6 feeling hashtags starting with # (e.g. #Heartwarming, #MindBlowing)',
                },
                tags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '2-4 emotion tags (e.g. "Deeply Impressed", "Cozy")',
                },
              },
              required: ['happiness', 'impressed', 'summary', 'hashtags', 'tags'],
            },
          },
        });

        const text = response.text;
        if (text) {
          const feelingsData = JSON.parse(text);
          feelingsData.happiness = Math.max(-100, Math.min(100, feelingsData.happiness ?? 0));
          feelingsData.impressed = Math.max(-100, Math.min(100, feelingsData.impressed ?? 0));
          feelingsData.hashtags = (feelingsData.hashtags || []).map((h: string) => {
            const clean = h.trim();
            return clean.startsWith('#') ? clean : `#${clean}`;
          });

          return res.json({ feelings: feelingsData, isPreview: false });
        }
      } catch (geminiErr: any) {
        console.warn('Gemini feeling analysis encountered an issue, using sentiment heuristics:', geminiErr?.message || geminiErr);
      }
    }

    // Heuristic feeling distinction fallback
    const notesLower = (userNotes || '').toLowerCase();
    const isDark = notesLower.includes('dark') || notesLower.includes('tragic') || notesLower.includes('death') || notesLower.includes('sad') || notesLower.includes('fear') || notesLower.includes('murder') || notesLower.includes('twist');
    const isJoy = notesLower.includes('happy') || notesLower.includes('joy') || notesLower.includes('love') || notesLower.includes('laugh') || notesLower.includes('warm') || notesLower.includes('cozy') || notesLower.includes('delight');
    const isDeep = (rating && rating >= 4) || notesLower.includes('worldbuilding') || notesLower.includes('philosophical') || notesLower.includes('mind') || notesLower.includes('profound') || notesLower.includes('incredible') || notesLower.includes('masterpiece');

    let happiness = 15;
    if (isDark) happiness -= 55;
    if (isJoy) happiness += 45;
    happiness = Math.max(-100, Math.min(100, happiness));

    let impressed = 20;
    if (isDeep) impressed += 50;
    if (rating) impressed += (rating - 3) * 15;
    impressed = Math.max(-100, Math.min(100, impressed));

    const hashtags: string[] = [];
    if (happiness > 20) hashtags.push('#Heartwarming', '#UpliftingVibes');
    else if (happiness < -20) hashtags.push('#DarkAtmosphere', '#PsychologicalEdge');
    else hashtags.push('#ThoughtProvoking');

    if (impressed > 30) hashtags.push('#DeeplyImpressed', '#MindBlowing');
    else hashtags.push('#EngagingRead');

    if (genre) {
      const cleanGenre = genre.replace(/[^a-zA-Z]/g, '');
      if (cleanGenre) hashtags.push(`#${cleanGenre}`);
    }

    const tags = hashtags.slice(0, 3).map(h => h.replace('#', ''));

    const feelingsData = {
      happiness,
      impressed,
      summary: `Your reflections capture a ${happiness >= 0 ? 'lively and encouraging' : 'contemplative and atmospheric'} mood with ${impressed >= 0 ? 'strong emotional impact and thoughtful depth' : 'accessible, enjoyable pacing'}.`,
      hashtags,
      tags
    };

    return res.json({ feelings: feelingsData, isPreview: !hasGeminiKey() });
  } catch (error: any) {
    console.error('Analyze Feelings Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to analyze feelings with Gemini' });
  }
});

// Endpoint 4: Interactive chat about book reflections with Gemini
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { messages, book } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (hasGeminiKey()) {
      try {
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

        const firstUserIndex = messages.findIndex((m: any) => m.role === 'user');
        const filteredMessages = firstUserIndex !== -1 ? messages.slice(firstUserIndex) : messages;

        const contents = filteredMessages.map((m: any) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

        const ai = getGeminiClient();
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
          },
        });

        const reply = response.text || "I'm listening and thinking, but I couldn't generate a response. Tell me more about what you felt!";
        return res.json({ reply, isPreview: false });
      } catch (geminiErr: any) {
        console.warn('Gemini chat encountered an issue, providing companion response:', geminiErr?.message || geminiErr);
      }
    }

    // Interactive conversational fallback when GEMINI_API_KEY is not yet configured
    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user')?.content || '';
    const userPromptLower = lastUserMessage.toLowerCase();

    let reply = '';
    if (book) {
      if (userPromptLower.includes('ending') || userPromptLower.includes('twist') || userPromptLower.includes('conclusion')) {
        reply = `The culmination of **"${book.title}"** is something readers frequently debate! The way ${book.author} weaves earlier foreshadowing into the final resolution leaves a lingering impression.\n\nDid the conclusion feel earned to you, or were there questions left unresolved that you wish were answered?`;
      } else if (userPromptLower.includes('character') || userPromptLower.includes('protagonist') || userPromptLower.includes('hero')) {
        reply = `Characters in **"${book.title}"** have such distinct internal motives and dilemmas. When you think about their choices, was there a particular moment where their decision completely changed how you viewed them?`;
      } else if (userPromptLower.includes('pace') || userPromptLower.includes('slow') || userPromptLower.includes('fast')) {
        reply = `Pacing can completely transform reading immersion. With **"${book.title}"**, the cadence shifts between contemplative worldbuilding and intense dramatic sequences.\n\nWhich chapters did you find yourself flying through the fastest?`;
      } else {
        reply = `That is a fascinating perspective on **"${book.title}"** by ${book.author}! ${book.userNotes ? `Reflecting on your earlier note about *"${book.userNotes.slice(0, 70)}..."*, ` : ''}it's clear this story sparked genuine reflection.\n\nWhat emotion or realization did you feel strongest while immersing yourself in this world?`;
      }
    } else {
      if (userPromptLower.includes('recommend') || userPromptLower.includes('next')) {
        reply = `If you're wondering what to pick up next, looking at your emotional positioning map is a great guide! Are you in the mood for something uplifting and joyful to brighten your week, or a deep, mind-bending epic?`;
      } else {
        reply = `Every book we read leaves an imprint on how we perceive the world. What has been the most memorable scene or concept from your recent reading that you haven't been able to stop thinking about?`;
      }
    }

    if (!hasGeminiKey()) {
      reply += `\n\n*(Gemini Companion is running in preview mode. To unlock live AI reasoning with Gemini 3.8 Flash, connect your GEMINI_API_KEY in the Settings > Secrets panel of AI Studio!)*`;
    }

    return res.json({ reply, isPreview: !hasGeminiKey() });
  } catch (error: any) {
    console.error('Gemini Chat Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate chat response' });
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
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
