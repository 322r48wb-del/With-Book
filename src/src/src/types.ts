/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ReadingStatus = 'to-read' | 'reading' | 'completed';

export interface BookFeelings {
  happiness: number; // -100 to 100 (Somber/Serious ↔ Happy/Joyful/Uplifting)
  impressed: number; // -100 to 100 (Casual/Lighthearted ↔ Deeply Impressed/Profound)
  tags?: string[];   // e.g. ["Happy", "Impressed", "Inspiring", "Tear-jerker"]
  hashtags?: string[]; // e.g. ["#Heartwarming", "#DeeplyMoved", "#MindBending", "#CozyRead"]
  summary?: string;  // Gemini's distilled feeling breakdown from reactions & notes
}

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  cover: string;
  description?: string;
  isbn?: string;
  userNotes: string;
  rating: number; // 0 to 5
  status: ReadingStatus;
  dateAdded: string;
  dateStarted?: string;
  dateCompleted?: string;
  keyQuotes?: string[];
  favorite: boolean;
  feelings?: BookFeelings;
}

export interface AIRecommendation {
  title: string;
  author: string;
  genre: string;
  reason: string;
  mood: string;
  estimatedPageCount: number;
}
