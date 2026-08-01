/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ReadingStatus = 'to-read' | 'reading' | 'completed';

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
}

export interface AIRecommendation {
  title: string;
  author: string;
  genre: string;
  reason: string;
  mood: string;
  estimatedPageCount: number;
}
