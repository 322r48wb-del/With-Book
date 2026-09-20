/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Book, BookFeelings } from '../types';

export interface QuadrantMeta {
  id: 'happy-impressed' | 'somber-impressed' | 'somber-casual' | 'happy-casual';
  title: string;
  subtitle: string;
  jpTitle: string;
  badgeColor: string;
  borderColor: string;
  bgColor: string;
  accentColor: string;
  description: string;
}

export const QUADRANT_DEFINITIONS: Record<QuadrantMeta['id'], QuadrantMeta> = {
  'happy-impressed': {
    id: 'happy-impressed',
    title: 'Heartwarming Masterpiece',
    subtitle: 'Deeply Moving & Joyful',
    jpTitle: '感涙・希望に満ちた傑作',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/5',
    accentColor: '#F59E0B',
    description: 'Profound, inspiring stories that elevate the spirit and leave a glowing sense of hope.'
  },
  'somber-impressed': {
    id: 'somber-impressed',
    title: 'Profound & Somber Epic',
    subtitle: 'Deeply Moving & Serious',
    jpTitle: '重厚・魂を揺さぶる感動作',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    borderColor: 'border-indigo-500/30',
    bgColor: 'bg-indigo-500/5',
    accentColor: '#818CF8',
    description: 'Thought-provoking, cathartic or tragic works of immense literary depth and philosophy.'
  },
  'somber-casual': {
    id: 'somber-casual',
    title: 'Dark & Gripping Escape',
    subtitle: 'Thrilling & Shadowy',
    jpTitle: 'スリリング・ダークな没頭',
    badgeColor: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40',
    borderColor: 'border-zinc-500/30',
    bgColor: 'bg-zinc-500/5',
    accentColor: '#9CA3AF',
    description: 'Fast-paced mysteries, psychological suspense, and gritty, atmospheric tales.'
  },
  'happy-casual': {
    id: 'happy-casual',
    title: 'Cozy & Feel-Good Fun',
    subtitle: 'Breezy & Cheerful',
    jpTitle: 'ほのぼの・爽快な癒やし',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/5',
    accentColor: '#34D399',
    description: 'Relaxing slice-of-life, uplifting comedies, and comforting, gentle comfort reads.'
  }
};

/**
 * Determine quadrant based on happiness and impressed coordinates (-100 to 100).
 */
export function getFeelingQuadrant(happiness: number, impressed: number): QuadrantMeta {
  if (happiness >= 0 && impressed >= 0) {
    return QUADRANT_DEFINITIONS['happy-impressed'];
  } else if (happiness < 0 && impressed >= 0) {
    return QUADRANT_DEFINITIONS['somber-impressed'];
  } else if (happiness < 0 && impressed < 0) {
    return QUADRANT_DEFINITIONS['somber-casual'];
  } else {
    return QUADRANT_DEFINITIONS['happy-casual'];
  }
}

/**
 * Intelligent heuristics to determine default feeling coordinates
 * when the user has not yet customized a book's coordinates manually.
 */
export function calculateDefaultFeelings(book: Book): BookFeelings {
  let happiness = 0;
  let impressed = 0;
  const tags: string[] = [];

  const text = `${book.title} ${book.genre} ${book.userNotes || ''} ${book.description || ''}`.toLowerCase();

  // Genre baseline
  const genre = (book.genre || '').toLowerCase();
  if (genre.includes('self-help') || genre.includes('psychology')) {
    happiness += 50;
    impressed += 50;
    tags.push('Inspiring');
  } else if (genre.includes('sci-fi') || genre.includes('science')) {
    happiness -= 10;
    impressed += 65;
    tags.push('Mind-bending');
  } else if (genre.includes('thriller') || genre.includes('mystery') || genre.includes('crime')) {
    happiness -= 45;
    impressed += 60;
    tags.push('Thrilling');
  } else if (genre.includes('fantasy')) {
    happiness += 25;
    impressed += 60;
    tags.push('Impressed');
  } else if (genre.includes('romance')) {
    happiness += 65;
    impressed += 35;
    tags.push('Heartwarming');
  } else if (genre.includes('philosophy') || genre.includes('classic')) {
    happiness -= 30;
    impressed += 80;
    tags.push('Profound');
  } else if (genre.includes('comedy') || genre.includes('humor')) {
    happiness += 80;
    impressed += 15;
    tags.push('Happy');
  }

  // Keywords scan for Happiness vs. Somber
  const happyWords = ['happy', 'joy', 'uplift', 'warm', 'hope', 'love', 'smile', 'laugh', 'delight', 'sweet', 'cozy', 'fun', 'heartwarming'];
  const somberWords = ['dark', 'sad', 'grief', 'tragic', 'death', 'pain', 'scary', 'haunt', 'dystopia', 'grim', 'somber', 'bleak', 'crying', 'tear'];

  happyWords.forEach(w => {
    if (text.includes(w)) happiness += 20;
  });
  somberWords.forEach(w => {
    if (text.includes(w)) happiness -= 25;
  });

  // Keywords scan for Impressed vs. Casual
  const impressedWords = ['masterpiece', 'incredible', 'profound', 'brilliant', 'epic', 'moving', 'shock', 'twist', 'unforgettable', 'life-changing', 'favorite', 'deep', 'jaw-dropping', 'mind-blown'];
  const casualWords = ['easy', 'casual', 'breezy', 'quick', 'light', 'simple', 'relaxing'];

  impressedWords.forEach(w => {
    if (text.includes(w)) impressed += 25;
  });
  casualWords.forEach(w => {
    if (text.includes(w)) impressed -= 20;
  });

  // Rating effect on "impressed"
  if (book.rating >= 5) {
    impressed += 30;
    if (!tags.includes('Impressed')) tags.push('Deeply Impressed');
  } else if (book.rating === 4) {
    impressed += 15;
  } else if (book.rating > 0 && book.rating <= 2) {
    impressed -= 25;
  }

  if (book.favorite) {
    impressed += 20;
    happiness += 15;
  }

  // Clamp within [-100, 100]
  happiness = Math.max(-100, Math.min(100, happiness));
  impressed = Math.max(-100, Math.min(100, impressed));

  if (happiness >= 30 && !tags.includes('Happy')) tags.unshift('Happy');
  if (impressed >= 40 && !tags.includes('Impressed')) tags.push('Impressed');

  // Derive initial feeling hashtags
  const hashtags: string[] = [];
  if (happiness >= 30 && impressed >= 30) {
    hashtags.push('#Heartwarming', '#DeeplyImpressed');
    if (genre.includes('self-help')) hashtags.push('#InspiringRead');
    else hashtags.push('#PureJoy');
  } else if (happiness < 0 && impressed >= 30) {
    hashtags.push('#ProfoundEpic', '#DeeplyImpressed');
    if (genre.includes('sci-fi') || text.includes('world')) hashtags.push('#MindBending');
    else hashtags.push('#Philosophical');
  } else if (happiness >= 20 && impressed < 30) {
    hashtags.push('#CozyVibes', '#BreezyEscape');
    if (text.includes('warm') || text.includes('gentle')) hashtags.push('#Heartwarming');
  } else {
    hashtags.push('#DarkAtmosphere', '#EdgeOfSeat');
    if (genre.includes('thriller') || text.includes('twist')) hashtags.push('#PsychologicalPuzzle');
  }

  return {
    happiness,
    impressed,
    tags: tags.slice(0, 3),
    hashtags: Array.from(new Set(hashtags)),
    summary: `Distinguished as ${happiness >= 0 ? 'uplifting & joyful' : 'somber & serious'} with ${impressed >= 0 ? 'profound resonance' : 'casual lightheartedness'}.`
  };
}

/**
 * Return resolved feelings for a book (existing or calculated).
 */
export function getBookFeelings(book: Book): BookFeelings {
  if (book.feelings && typeof book.feelings.happiness === 'number' && typeof book.feelings.impressed === 'number') {
    // If hashtags were missing, provide default hashtags
    if (!book.feelings.hashtags || book.feelings.hashtags.length === 0) {
      const fallback = calculateDefaultFeelings(book);
      return {
        ...book.feelings,
        hashtags: fallback.hashtags,
        summary: book.feelings.summary || fallback.summary
      };
    }
    return book.feelings;
  }
  return calculateDefaultFeelings(book);
}

export const FEELING_TAG_PRESETS = [
  '😊 Happy & Uplifting',
  '🥹 Deeply Impressed',
  '✨ Inspiring',
  '😭 Tear-jerker / Cathartic',
  '🧠 Mind-bending / Deep',
  '☕ Cozy & Relaxing',
  '⚡ Thrilling & Intense',
  '🕊️ Peaceful & Gentle'
];

export const FEELING_HASHTAG_PRESETS = [
  '#Heartwarming',
  '#DeeplyImpressed',
  '#MindBending',
  '#TearJerker',
  '#CozyVibes',
  '#DarkAtmosphere',
  '#InspiringRead',
  '#ProfoundEpic',
  '#PsychologicalPuzzle',
  '#PureJoy',
  '#Philosophical',
  '#Cathartic',
  '#BreezyEscape',
  '#EdgeOfSeat'
];
