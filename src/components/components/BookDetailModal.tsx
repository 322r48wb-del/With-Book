/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Heart, Star, Calendar, MessageSquare, Quote, Trash2 } from 'lucide-react';
import { Book, ReadingStatus } from '../types';
import BookCover from './BookCover';

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
  
  // Quotes section
  const [quotes, setQuotes] = useState<string[]>(book.keyQuotes || []);
  const [newQuote, setNewQuote] = useState<string>('');

  // Synchronize component state if the active book prop changes
  useEffect(() => {
    setStatus(book.status);
    setRating(book.rating);
    setUserNotes(book.userNotes || '');
    setFavorite(book.favorite || false);
    setDateStarted(book.dateStarted || '');
    setDateCompleted(book.dateCompleted || '');
    setQuotes(book.keyQuotes || []);
  }, [book]);

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
              onClick={() => setFavorite(!favorite)}
              className={`p-2 rounded-lg transition-all ${favorite ? 'text-rose-400 bg-rose-500/10' : 'text-[#9CA3AF] hover:text-white bg-transparent'}`}
            >
              <Heart className={`w-5 h-5 ${favorite ? 'fill-rose-400' : ''}`} />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-[#9CA3AF] hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all"
              title="Delete Book"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
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
              <label className="text-[10px] font-mono tracking-wider text-[#6B7280] uppercase block mb-1.5 flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-amber-500" />
                REACTIONS & NOTES
              </label>
              <div className="relative rounded-lg border border-[#212429] overflow-hidden shadow-xs">
                {/* Lined paper theme background texture */}
                <textarea
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="How did this book make you feel? What were your key realizations or thoughts on the pacing and characters? Gemini will read this when offering recommendations!"
                  className="w-full min-h-[120px] p-4 text-xs font-serif leading-relaxed bg-[#16191F] text-[#E0E2E6] placeholder-[#6B7280] focus:outline-none focus:ring-0 resize-y"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
                    backgroundSize: '100% 24px',
                    lineHeight: '24px',
                  }}
                />
              </div>
            </div>

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
        <div className="px-6 py-4 border-t border-[#212429] bg-[#16191F] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-sans font-semibold text-[#9CA3AF] hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-sans font-semibold text-black bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors shadow-sm font-bold"
          >
            Save Journal Entry
          </button>
        </div>

      </div>
    </div>
  );
}
