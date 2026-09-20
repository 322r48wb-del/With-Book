/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Heart, Star, Calendar, MessageSquare, Quote, Trash2, Compass, Smile, Award, Sparkles, Hash, Plus, Loader2, Check, Share2 } from 'lucide-react';
import { Book, ReadingStatus, BookFeelings } from '../types';
import { getBookFeelings, getFeelingQuadrant, FEELING_TAG_PRESETS, FEELING_HASHTAG_PRESETS } from '../utils/feelingUtils';
import BookCover from './BookCover';
import ShareLogsModal from './ShareLogsModal';

interface BookDetailModalProps {
  book: Book;
  onClose: () => void;
  onSave: (updatedBook: Book) => void;
  onDelete: (bookId: string) => void;
}

export default function BookDetailModal({ book, onClose, onSave, onDelete }: BookDetailModalProps) {
  const [status, setStatus] = useState<ReadingStatus>(book.status);
  const [rating, setRating] = useState<number>(book.rating);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [userNotes, setUserNotes] = useState<string>(book.userNotes || '');
  const [favorite, setFavorite] = useState<boolean>(book.favorite || false);
  const [dateStarted, setDateStarted] = useState<string>(book.dateStarted || '');
  const [dateCompleted, setDateCompleted] = useState<string>(book.dateCompleted || '');
  
  // Emotional positioning feelings state
  const initialFeelings = getBookFeelings(book);
  const [happiness, setHappiness] = useState<number>(initialFeelings.happiness);
  const [impressed, setImpressed] = useState<number>(initialFeelings.impressed);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialFeelings.tags || []);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>(initialFeelings.hashtags || []);
  const [geminiSummary, setGeminiSummary] = useState<string>(initialFeelings.summary || '');
  const [customHashtagInput, setCustomHashtagInput] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisSuccess, setAnalysisSuccess] = useState<boolean>(false);

  // Quotes section
  const [quotes, setQuotes] = useState<string[]>(book.keyQuotes || []);
  const [newQuote, setNewQuote] = useState<string>('');

  // Share modal state
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);

  // Synchronize component state if the active book prop changes
  useEffect(() => {
    setStatus(book.status);
    setRating(book.rating);
    setUserNotes(book.userNotes || '');
    setFavorite(book.favorite || false);
    setDateStarted(book.dateStarted || '');
    setDateCompleted(book.dateCompleted || '');
    setQuotes(book.keyQuotes || []);
    
    const f = getBookFeelings(book);
    setHappiness(f.happiness);
    setImpressed(f.impressed);
    setSelectedTags(f.tags || []);
    setSelectedHashtags(f.hashtags || []);
    setGeminiSummary(f.summary || '');
    setAnalysisSuccess(false);
  }, [book]);

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleToggleHashtag = (rawTag: string) => {
    const formatted = rawTag.startsWith('#') ? rawTag : `#${rawTag}`;
    if (selectedHashtags.includes(formatted)) {
      setSelectedHashtags(selectedHashtags.filter(h => h !== formatted));
    } else {
      setSelectedHashtags([...selectedHashtags, formatted]);
    }
  };

  const handleAddCustomHashtag = () => {
    if (!customHashtagInput.trim()) return;
    const clean = customHashtagInput.trim().replace(/\s+/g, '');
    const formatted = clean.startsWith('#') ? clean : `#${clean}`;
    if (!selectedHashtags.includes(formatted)) {
      setSelectedHashtags([...selectedHashtags, formatted]);
    }
    setCustomHashtagInput('');
  };

  const handleAnalyzeFeelingsWithGemini = async () => {
    setIsAnalyzing(true);
    setAnalysisSuccess(false);
    try {
      const res = await fetch('/api/ai/analyze-feelings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: book.title,
          author: book.author,
          genre: book.genre,
          userNotes: userNotes,
          rating: rating,
          keyQuotes: quotes
        })
      });
      const data = await res.json();
      if (data.feelings) {
        setHappiness(data.feelings.happiness);
        setImpressed(data.feelings.impressed);
        if (data.feelings.hashtags && data.feelings.hashtags.length > 0) {
          setSelectedHashtags(data.feelings.hashtags);
        }
        if (data.feelings.tags && data.feelings.tags.length > 0) {
          setSelectedTags(data.feelings.tags);
        }
        if (data.feelings.summary) {
          setGeminiSummary(data.feelings.summary);
        }
        setAnalysisSuccess(true);
        setTimeout(() => setAnalysisSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Failed to distinguish feelings with Gemini:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    onSave({
      ...book,
      status,
      rating,
      userNotes,
      favorite,
      dateStarted: dateStarted || undefined,
      dateCompleted: status === 'completed' ? (dateCompleted || undefined) : undefined,
      keyQuotes: quotes,
      feelings: {
        happiness,
        impressed,
        tags: selectedTags,
        hashtags: selectedHashtags,
        summary: geminiSummary
      }
    });
    onClose();
  };

  const handleAddQuote = () => {
    if (newQuote.trim()) {
      setQuotes([...quotes, newQuote.trim()]);
      setNewQuote('');
    }
  };

  const handleRemoveQuote = (idx: number) => {
    setQuotes(quotes.filter((_, i) => i !== idx));
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${book.title}" from your journal?`)) {
      onDelete(book.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
      <div className="bg-[#0F1115] rounded-xl border border-[#212429] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300">
        
        {/* Header toolbar */}
        <div className="px-6 py-4 border-b border-[#212429] bg-[#16191F] flex justify-between items-center">
          <span className="font-mono text-[10px] tracking-widest text-amber-500 font-semibold uppercase">
            READING JOURNAL
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsShareOpen(true)}
              className="p-2 text-[#9CA3AF] hover:text-amber-400 rounded-lg hover:bg-amber-500/10 transition-all"
              title="Share this book log & review"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setFavorite(!favorite)}
              className={`p-2 rounded-lg transition-all ${favorite ? 'text-rose-400 bg-rose-500/10' : 'text-[#9CA3AF] hover:text-white bg-transparent'}`}
            >
              <Heart className={`w-5 h-5 ${favorite ? 'fill-rose-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="p-2 text-[#9CA3AF] hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all"
              title="Delete Book"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-[#9CA3AF] hover:text-white hover:bg-zinc-800/50 rounded-md transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
          
          {/* Left panel: book visual & dates */}
          <div className="flex flex-col items-center md:items-start md:w-1/3 gap-4">
            <BookCover title={book.title} author={book.author} genre={book.genre} isbn={book.isbn} size="lg" />
            
            <div className="w-full mt-2">
              <span className="text-[10px] font-mono tracking-wider text-[#6B7280] uppercase block mb-1">
                GENRE
              </span>
              <span className="px-2.5 py-1 text-xs font-sans font-medium bg-[#212429] text-stone-300 rounded-full inline-block">
                {book.genre}
              </span>
            </div>

            {book.isbn && (
              <div className="w-full">
                <span className="text-[10px] font-mono tracking-wider text-[#6B7280] uppercase block">
                  ISBN-13
                </span>
                <span className="text-xs font-mono text-[#9CA3AF]">
                  {book.isbn}
                </span>
              </div>
            )}

            {/* Dates Tracker */}
            <div className="w-full space-y-3 pt-3 border-t border-[#212429]">
              <div>
                <label className="text-[10px] font-mono tracking-wider text-[#6B7280] uppercase block mb-1">
                  DATE STARTED
                </label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-2 w-3.5 h-3.5 text-[#6B7280] pointer-events-none" />
                  <input
                    type="date"
                    value={dateStarted}
                    onChange={(e) => setDateStarted(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 text-xs border border-[#212429] rounded-md bg-[#16191F] text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {status === 'completed' && (
                <div>
                  <label className="text-[10px] font-mono tracking-wider text-[#6B7280] uppercase block mb-1">
                    DATE FINISHED
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-2 top-2 w-3.5 h-3.5 text-[#6B7280] pointer-events-none" />
                    <input
                      type="date"
                      value={dateCompleted}
                      onChange={(e) => setDateCompleted(e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 text-xs border border-[#212429] rounded-md bg-[#16191F] text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right panel: editing details & diaries */}
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="font-serif font-extrabold text-2xl text-white tracking-tight leading-snug">
                {book.title}
              </h2>
              <p className="text-sm font-sans font-medium text-[#9CA3AF] mt-1">
                by <span className="text-stone-200">{book.author}</span>
              </p>
              {book.description && (
                <p className="text-xs text-[#9CA3AF] leading-relaxed font-sans italic mt-2 bg-[#16191F] p-2.5 rounded border border-[#212429]">
                  {book.description}
                </p>
              )}
            </div>

            {/* Reading Status Buttons */}
            <div>
              <span className="text-[10px] font-mono tracking-wider text-[#6B7280] uppercase block mb-1.5">
                READING LOG STATUS
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['to-read', 'reading', 'completed'] as ReadingStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatus(st)}
                    className={`py-2 px-1 text-xs font-sans font-medium rounded-lg border transition-all uppercase tracking-wider text-center
                      ${status === st
                        ? 'bg-amber-500 border-amber-500 text-black font-bold'
                        : 'bg-[#16191F] border-[#212429] hover:border-[#4B5563] text-[#9CA3AF]'
                      }`}
                  >
                    {st === 'to-read' ? '⏳ To Read' : st === 'reading' ? '📖 Reading' : '✅ Done'}
                  </button>
                ))}
              </div>
            </div>

            {/* Star ratings */}
            <div>
              <span className="text-[10px] font-mono tracking-wider text-[#6B7280] uppercase block mb-1">
                YOUR RATING
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-all hover:scale-110"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        (hoverRating || rating) >= star
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-[#212429] fill-[#212429]'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-mono font-bold text-[#6B7280] ml-2">
                  {rating > 0 ? `${rating} / 5` : 'No rating'}
                </span>
              </div>
            </div>

            {/* Book Excerpt / Lined Notebook Diary */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-mono tracking-wider text-[#6B7280] uppercase flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-amber-500" />
                  REACTIONS & NOTES
                </label>
                {/* Gemini Distinguish Feeling Trigger */}
                <button
                  type="button"
                  onClick={handleAnalyzeFeelingsWithGemini}
                  disabled={isAnalyzing}
                  className="px-2.5 py-1 text-[11px] font-sans font-semibold rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border border-amber-500/40 hover:border-amber-500/80 hover:from-amber-500/30 hover:to-amber-600/30 transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  title="Gemini will analyze your reactions and notes to distinguish your feeling coordinates and generate hashtags"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                      <span>Distinguishing Feeling...</span>
                    </>
                  ) : analysisSuccess ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-300">Feelings & Hashtags Updated!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Distinguish with Gemini</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-lg border border-[#212429] overflow-hidden shadow-xs">
                {/* Lined paper theme background texture */}
                <textarea
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="How did this book make you feel? What were your key realizations or thoughts on the pacing and characters? Gemini will distinguish your emotional feelings and hashtags!"
                  className="w-full min-h-[100px] p-4 text-xs font-serif leading-relaxed bg-[#16191F] text-[#E0E2E6] placeholder-[#6B7280] focus:outline-none focus:ring-0 resize-y"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
                    backgroundSize: '100% 24px',
                    lineHeight: '24px',
                  }}
                />
              </div>

              {/* Gemini distilled feeling summary if available */}
              {geminiSummary && (
                <div className="mt-2 p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-lg flex items-start gap-2 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold block">
                      Gemini Feeling Analysis:
                    </span>
                    <p className="text-stone-300 font-serif italic text-xs leading-relaxed">
                      "{geminiSummary}"
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Feelings & Emotional Positioning Map Controls */}
            {(() => {
              const activeQuadrant = getFeelingQuadrant(happiness, impressed);
              return (
                <div className="bg-[#12141A] border border-[#212429] rounded-xl p-3.5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono tracking-wider text-amber-400 uppercase font-semibold flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-amber-500" />
                      FEELINGS & POSITIONING MAP
                    </label>
                    <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold ${activeQuadrant.badgeColor}`}>
                      {activeQuadrant.title}
                    </span>
                  </div>

                  {/* Slider 1: Happiness (Somber to Happy) */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[11px] font-sans font-medium text-stone-300 flex items-center gap-1">
                        <Smile className="w-3.5 h-3.5 text-amber-400" />
                        Feeling Tone (Happy vs. Somber):
                      </span>
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {happiness >= 0 ? `+${happiness}% (Happy & Uplifting)` : `${happiness}% (Somber & Serious)`}
                      </span>
                    </div>
                    <input 
                      type="range"
                      min="-100"
                      max="100"
                      value={happiness}
                      onChange={(e) => setHappiness(parseInt(e.target.value, 10))}
                      className="w-full accent-amber-500 cursor-pointer h-1.5 bg-[#212429] rounded-lg"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-[#6B7280] mt-0.5">
                      <span>Somber / Dark (-100)</span>
                      <span>Neutral (0)</span>
                      <span>Happy / Cheerful (+100)</span>
                    </div>
                  </div>

                  {/* Slider 2: Impressed (Casual to Deeply Impressed) */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[11px] font-sans font-medium text-stone-300 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        Resonance (Deeply Impressed vs. Casual):
                      </span>
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {impressed >= 0 ? `+${impressed}% (Deeply Impressed)` : `${impressed}% (Casual & Breezy)`}
                      </span>
                    </div>
                    <input 
                      type="range"
                      min="-100"
                      max="100"
                      value={impressed}
                      onChange={(e) => setImpressed(parseInt(e.target.value, 10))}
                      className="w-full accent-amber-500 cursor-pointer h-1.5 bg-[#212429] rounded-lg"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-[#6B7280] mt-0.5">
                      <span>Casual / Light (-100)</span>
                      <span>Moderate (0)</span>
                      <span>Deeply Impressed / Moving (+100)</span>
                    </div>
                  </div>

                  {/* Feeling Hashtags Section */}
                  <div className="pt-2 border-t border-[#212429]">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold flex items-center gap-1">
                        <Hash className="w-3 h-3 text-amber-500" />
                        FEELING HASHTAGS
                      </span>
                      <span className="text-[9px] font-sans text-[#9CA3AF]">
                        Easily categorize & filter feeling vibes
                      </span>
                    </div>

                    {/* Active Selected Hashtags */}
                    <div className="flex flex-wrap gap-1.5 mb-2.5 min-h-[28px] p-2 bg-[#16191F] border border-[#212429] rounded-lg">
                      {selectedHashtags.length === 0 ? (
                        <span className="text-[11px] font-sans text-[#6B7280] italic">
                          No hashtags yet. Use "Distinguish with Gemini" or pick presets below!
                        </span>
                      ) : (
                        selectedHashtags.map((h) => (
                          <span
                            key={h}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          >
                            <span>{h}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleHashtag(h)}
                              className="hover:text-white p-0.5 rounded-full hover:bg-amber-500/40 transition-colors"
                              title="Remove hashtag"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    {/* Custom Hashtag Input */}
                    <div className="flex gap-1.5 mb-2.5">
                      <div className="relative flex-1">
                        <Hash className="absolute left-2.5 top-2 w-3 h-3 text-[#6B7280]" />
                        <input
                          type="text"
                          value={customHashtagInput}
                          onChange={(e) => setCustomHashtagInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomHashtag())}
                          placeholder="Add custom hashtag (e.g. #MindBlowing)..."
                          className="w-full pl-7 pr-3 py-1 text-xs bg-[#16191F] border border-[#212429] rounded-lg text-white placeholder-[#6B7280] focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCustomHashtag}
                        className="px-2.5 py-1 text-xs font-sans font-medium rounded-lg bg-[#212429] hover:bg-[#2A2E35] text-stone-300 hover:text-white transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    </div>

                    {/* Quick Preset Hashtags */}
                    <div>
                      <span className="text-[9px] font-mono text-[#6B7280] uppercase block mb-1">
                        Suggested Feeling Hashtags:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {FEELING_HASHTAG_PRESETS.map((preset) => {
                          const isSelected = selectedHashtags.includes(preset);
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleToggleHashtag(preset)}
                              className={`px-2 py-0.5 text-[10px] font-mono rounded-full border transition-all
                                ${isSelected
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                                  : 'bg-[#16191F] text-[#9CA3AF] border-[#212429] hover:border-[#4B5563] hover:text-white'
                                }`}
                            >
                              {preset}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Quick feeling tags */}
                  <div className="pt-2 border-t border-[#212429]">
                    <span className="text-[10px] font-mono text-[#6B7280] uppercase block mb-1">
                      Feeling Emotion Highlights:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {FEELING_TAG_PRESETS.map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleToggleTag(tag)}
                            className={`px-2 py-0.5 text-[10px] font-sans rounded-full border transition-all
                              ${isSelected
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-semibold'
                                : 'bg-[#16191F] text-[#9CA3AF] border-[#212429] hover:border-[#4B5563]'
                              }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Favorite quotes tagging system */}
            <div>
              <label className="text-[10px] font-mono tracking-wider text-[#6B7280] uppercase block mb-1.5 flex items-center gap-1">
                <Quote className="w-3 h-3 text-amber-500" />
                FAVORITE QUOTES & PASSAGES
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste a striking sentence from the book..."
                  value={newQuote}
                  onChange={(e) => setNewQuote(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-[#16191F] border border-[#212429] text-white placeholder-[#6B7280] rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddQuote();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddQuote}
                  className="bg-[#212429] hover:bg-amber-500 hover:text-black text-white text-xs px-3 py-1.5 rounded-lg transition-colors font-semibold"
                >
                  Add
                </button>
              </div>

              {quotes.length > 0 && (
                <div className="flex flex-col gap-2 mt-2 max-h-[120px] overflow-y-auto pt-1">
                  {quotes.map((quote, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-2 p-2 bg-[#16191F] rounded-lg border border-[#212429] text-[11px] text-[#E0E2E6] font-serif italic"
                    >
                      <p className="flex-1">"{quote}"</p>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuote(idx)}
                        className="text-[#9CA3AF] hover:text-red-400 font-sans text-xs px-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-[#212429] bg-[#16191F] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            className="px-3 py-2 text-xs font-sans font-semibold text-stone-300 hover:text-white bg-[#212429] hover:bg-[#2A2E36] border border-[#212429] rounded-lg transition-colors flex items-center gap-1.5"
            title="Share quotes and reflections from this book"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-500" />
            <span>Share Log</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-sans font-semibold text-[#9CA3AF] hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-sans font-semibold text-black bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors shadow-sm font-bold"
            >
              Save Journal Entry
            </button>
          </div>
        </div>

      </div>

      {/* Share Book Log Modal */}
      {isShareOpen && (
        <ShareLogsModal
          library={[book]}
          readingGoal={12}
          initialBook={book}
          onClose={() => setIsShareOpen(false)}
        />
      )}
    </div>
  );
}
