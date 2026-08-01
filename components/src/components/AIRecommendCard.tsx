/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, BookOpen, Compass, Plus, Loader2 } from 'lucide-react';
import { Book, AIRecommendation } from '../types';

interface AIRecommendCardProps {
  library: Book[];
  onAddRecommendation: (rec: AIRecommendation) => void;
}

export default function AIRecommendCard({ library, onAddRecommendation }: AIRecommendCardProps) {
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Load saved recommendation from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('withbook_ai_rec');
    if (saved) {
      try {
        setRecommendation(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Cycling fun loading messages for the "Literary Oracle" experience
  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 4);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const loadingMessages = [
    'Consulting the literary archive...',
    'Whispering to your notes & reflections...',
    'Analyzing the emotional weight of your library...',
    'Scribing your personalized suggestion...',
  ];

  const generateRecommendation = async () => {
    if (library.length === 0) {
      setError('Please add at least one book to your library first so Gemini can learn your literary taste!');
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingStep(0);

    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ library }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to analyze library');
      }

      const data = await res.json();
      if (data.recommendation) {
        setRecommendation(data.recommendation);
        localStorage.setItem('withbook_ai_rec', JSON.stringify(data.recommendation));
      } else {
        throw new Error('Invalid response structure from server');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while calling the Gemini API.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    if (recommendation) {
      onAddRecommendation(recommendation);
      // Optional: Clear after adding or keep as recommended
    }
  };

  return (
    <div className="bg-[#0F1115] rounded-xl border border-[#212429] shadow-md p-6 relative overflow-hidden">
      {/* Decorative background circle */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-amber-500" />
        <h3 className="font-serif font-semibold text-lg tracking-tight text-white">
          The Gemini Literary Oracle
        </h3>
      </div>

      <p className="text-[#9CA3AF] text-xs leading-relaxed mb-4 font-sans">
        Analyze your reading logs, review ratings, and journal notes to discover your next great read.
      </p>

      {error && (
        <div className="p-3.5 mb-4 text-xs bg-rose-950/50 text-rose-300 border border-rose-900/40 rounded-lg space-y-2">
          <p className="font-semibold">{error}</p>
          {error.toLowerCase().includes('api key') && (
            <p className="text-[11px] text-stone-300 leading-normal border-t border-rose-900/40 pt-2">
              💡 <strong>API Key Setup:</strong> Open <strong>Settings &gt; Secrets</strong> in AI Studio and add your <code className="text-amber-400 bg-black/40 px-1 py-0.5 rounded">GEMINI_API_KEY</code>.
            </p>
          )}
        </div>
      )}

      {loading ? (
        <div className="my-6 py-8 flex flex-col items-center justify-center text-center gap-3 bg-[#16191F] rounded-lg border border-[#212429]">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-mono font-medium text-amber-500 tracking-widest uppercase">
              THINKING...
            </span>
            <span className="text-[#9CA3AF] text-xs italic font-serif transition-opacity duration-500">
              {loadingMessages[loadingStep]}
            </span>
          </div>
        </div>
      ) : recommendation ? (
        <div className="bg-[#16191F] rounded-lg border border-[#212429] p-4 mb-4 relative transition-all duration-300">
          <div className="absolute top-3 right-3 text-[10px] font-mono tracking-wider text-amber-400 uppercase px-1.5 py-0.5 bg-amber-500/10 rounded border border-amber-500/20">
            {recommendation.mood}
          </div>

          <div className="mb-3">
            <span className="text-[10px] font-mono tracking-widest text-[#6B7280] uppercase">
              NEXT SUGGESTED READ
            </span>
            <h4 className="font-serif font-bold text-lg text-white tracking-tight leading-snug mt-0.5">
              {recommendation.title}
            </h4>
            <p className="text-xs text-[#9CA3AF] mt-0.5">by {recommendation.author}</p>
          </div>

          <div className="flex gap-2 mb-3">
            <span className="text-[10px] bg-[#212429] px-2 py-0.5 rounded text-stone-300 font-sans font-medium">
              {recommendation.genre}
            </span>
            <span className="text-[10px] bg-[#212429] px-2 py-0.5 rounded text-stone-300 font-sans font-medium">
              ~{recommendation.estimatedPageCount} pages
            </span>
          </div>

          <p className="text-[#E0E2E6] text-xs leading-relaxed font-sans italic border-l-2 border-amber-500 pl-3 mb-4">
            "{recommendation.reason}"
          </p>

          <div className="flex gap-2 pt-2 border-t border-[#212429]">
            <button
              onClick={handleAdd}
              className="flex-1 flex items-center justify-center gap-1.5 bg-white hover:bg-stone-100 text-black text-xs font-bold py-2 px-3 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add to Wishlist
            </button>
            <button
              onClick={generateRecommendation}
              className="flex-1 border border-[#212429] bg-[#16191F] hover:bg-[#212429] text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors"
            >
              Ask Again
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-[#212429] rounded-lg bg-[#16191F]/40">
          <Compass className="w-8 h-8 text-[#4B5563] mb-2" />
          <p className="text-[#6B7280] text-xs font-serif italic mb-4 max-w-[200px]">
            "No recommended book on file yet. Let the oracle guide your journey."
          </p>
          <button
            onClick={generateRecommendation}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Ask AI What to Read Next
          </button>
        </div>
      )}
    </div>
  );
}
