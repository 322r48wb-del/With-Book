/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Compass, 
  Sparkles, 
  Move, 
  Heart, 
  Star, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Info,
  Maximize2,
  ExternalLink,
  ChevronRight,
  Smile,
  Award,
  Hash,
  Loader2
} from 'lucide-react';
import { Book, ReadingStatus, BookFeelings } from '../types';
import { 
  getFeelingQuadrant, 
  getBookFeelings, 
  QUADRANT_DEFINITIONS, 
  QuadrantMeta 
} from '../utils/feelingUtils';
import BookCover from './BookCover';

interface BookPositioningMapProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
  onUpdateBookFeelings: (bookId: string, feelings: BookFeelings) => void;
  searchFilter?: string;
}

type DisplayMode = 'covers' | 'pins' | 'titles';

export default function BookPositioningMap({
  books,
  onSelectBook,
  onUpdateBookFeelings,
  searchFilter = ''
}: BookPositioningMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Active dragging state
  const [draggingBookId, setDraggingBookId] = useState<string | null>(null);
  const [dragCoords, setDragCoords] = useState<{ x: number; y: number } | null>(null); // -100 to 100
  const [selectedMapBook, setSelectedMapBook] = useState<Book | null>(null);
  
  // Display settings
  const [displayMode, setDisplayMode] = useState<DisplayMode>('covers');
  const [statusFilter, setStatusFilter] = useState<'all' | ReadingStatus>('all');
  const [quadrantFilter, setQuadrantFilter] = useState<string>('all');
  const [selectedHashtag, setSelectedHashtag] = useState<string>('all');
  const [isAnalyzingGemini, setIsAnalyzingGemini] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Clear toast after 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Extract all unique hashtags
  const allHashtags = Array.from(
    new Set(
      books.flatMap((b) => getBookFeelings(b).hashtags || [])
    )
  );

  // Filtered books for the map
  const filteredBooks = books.filter((book) => {
    if (statusFilter !== 'all' && book.status !== statusFilter) return false;
    
    const feelings = getBookFeelings(book);
    const quad = getFeelingQuadrant(feelings.happiness, feelings.impressed);
    if (quadrantFilter !== 'all' && quad.id !== quadrantFilter) return false;

    if (selectedHashtag !== 'all') {
      if (!feelings.hashtags || !feelings.hashtags.includes(selectedHashtag)) {
        return false;
      }
    }

    if (searchFilter.trim()) {
      const term = searchFilter.toLowerCase();
      return (
        book.title.toLowerCase().includes(term) ||
        book.author.toLowerCase().includes(term) ||
        book.userNotes.toLowerCase().includes(term) ||
        book.genre.toLowerCase().includes(term) ||
        (feelings.hashtags && feelings.hashtags.some(h => h.toLowerCase().includes(term)))
      );
    }
    return true;
  });

  // Calculate distribution metrics across the 4 quadrants
  const quadrantCounts = books.reduce((acc, book) => {
    const feelings = getBookFeelings(book);
    const quad = getFeelingQuadrant(feelings.happiness, feelings.impressed);
    acc[quad.id] = (acc[quad.id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Convert mouse/touch event into [-100, 100] coordinates
  const calculateCoordinatesFromEvent = useCallback((clientX: number, clientY: number) => {
    if (!mapContainerRef.current) return { x: 0, y: 0 };
    const rect = mapContainerRef.current.getBoundingClientRect();
    
    // Position inside the box (0 to 1)
    const relX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const relY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    // Map: relX 0 -> -100, 1 -> +100
    // Map: relY 0 -> +100 (top is high impressed), 1 -> -100 (bottom is low impressed)
    const happiness = Math.round((relX * 200) - 100);
    const impressed = Math.round(100 - (relY * 200));

    return {
      x: Math.max(-100, Math.min(100, happiness)),
      y: Math.max(-100, Math.min(100, impressed))
    };
  }, []);

  // Global mousemove and mouseup listeners for dragging
  useEffect(() => {
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!draggingBookId) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const coords = calculateCoordinatesFromEvent(clientX, clientY);
      setDragCoords(coords);
    };

    const handlePointerUp = () => {
      if (draggingBookId && dragCoords) {
        const book = books.find(b => b.id === draggingBookId);
        if (book) {
          const currentFeelings = getBookFeelings(book);
          const newFeelings: BookFeelings = {
            ...currentFeelings,
            happiness: dragCoords.x,
            impressed: dragCoords.y
          };
          onUpdateBookFeelings(draggingBookId, newFeelings);
          const quad = getFeelingQuadrant(dragCoords.x, dragCoords.y);
          setToastMessage(`Updated "${book.title}" to ${quad.title} (${dragCoords.x >= 0 ? '+' : ''}${dragCoords.x} Happy, ${dragCoords.y >= 0 ? '+' : ''}${dragCoords.y} Impressed)`);
        }
      }
      setDraggingBookId(null);
      setDragCoords(null);
    };

    if (draggingBookId) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove);
      window.addEventListener('touchend', handlePointerUp);
    }

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [draggingBookId, dragCoords, books, calculateCoordinatesFromEvent, onUpdateBookFeelings]);

  // Start dragging a book node
  const handleStartDrag = (e: React.MouseEvent | React.TouchEvent, book: Book) => {
    e.stopPropagation();
    setDraggingBookId(book.id);
    setSelectedMapBook(book);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const coords = calculateCoordinatesFromEvent(clientX, clientY);
    setDragCoords(coords);
  };

  // Convert feelings into percentage for CSS left & top
  const getCoordinatesPercent = (happiness: number, impressed: number) => {
    const left = ((happiness + 100) / 200) * 100;
    const top = ((100 - impressed) / 200) * 100;
    return { left, top };
  };

  // In-map Gemini feeling & hashtag distinction
  const handleDistinguishWithGeminiOnMap = async (bookToAnalyze: Book) => {
    setIsAnalyzingGemini(true);
    try {
      const res = await fetch('/api/ai/analyze-feelings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: bookToAnalyze.title,
          author: bookToAnalyze.author,
          genre: bookToAnalyze.genre,
          userNotes: bookToAnalyze.userNotes,
          rating: bookToAnalyze.rating,
          keyQuotes: bookToAnalyze.keyQuotes,
        })
      });
      const data = await res.json();
      if (data.feelings) {
        const newFeelings: BookFeelings = {
          happiness: data.feelings.happiness,
          impressed: data.feelings.impressed,
          tags: data.feelings.tags,
          hashtags: data.feelings.hashtags,
          summary: data.feelings.summary
        };
        onUpdateBookFeelings(bookToAnalyze.id, newFeelings);
        setSelectedMapBook({ ...bookToAnalyze, feelings: newFeelings });
        setToastMessage(`✨ Gemini distinguished: "${data.feelings.summary}"`);
      }
    } catch (err) {
      console.error('Failed to distinguish feelings with Gemini on map:', err);
    } finally {
      setIsAnalyzingGemini(false);
    }
  };

  return (
    <div className="space-y-4 w-full animate-fade-in">
      {/* Header controls bar */}
      <div className="bg-[#0F1115] border border-[#212429] rounded-xl p-4 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <Compass className="w-4 h-4" />
            </span>
            <h2 className="font-serif font-bold text-white text-lg tracking-tight">
              Feelings & Emotional Positioning Map
            </h2>
          </div>
          <p className="text-xs text-[#9CA3AF] mt-1 font-sans">
            Visualizing your books along <strong className="text-amber-400">Happiness</strong> (Happy vs. Somber) and <strong className="text-amber-400">Impression</strong> (Profound vs. Casual). Drag any book to reposition it.
          </p>
        </div>

        {/* Action toggles: view modes & filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center bg-[#16191F] border border-[#212429] rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${statusFilter === 'all' ? 'bg-amber-500 text-black font-bold' : 'text-[#9CA3AF] hover:text-white'}`}
            >
              All ({books.length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${statusFilter === 'completed' ? 'bg-emerald-500 text-black font-bold' : 'text-[#9CA3AF] hover:text-white'}`}
            >
              Done
            </button>
            <button
              onClick={() => setStatusFilter('reading')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${statusFilter === 'reading' ? 'bg-amber-500/30 text-amber-300 font-bold' : 'text-[#9CA3AF] hover:text-white'}`}
            >
              Reading
            </button>
          </div>

          {/* Display Mode */}
          <div className="flex items-center bg-[#16191F] border border-[#212429] rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setDisplayMode('covers')}
              title="Mini Book Covers"
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${displayMode === 'covers' ? 'bg-[#212429] text-white font-bold' : 'text-[#9CA3AF] hover:text-white'}`}
            >
              Covers
            </button>
            <button
              onClick={() => setDisplayMode('pins')}
              title="Compact Nodes"
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${displayMode === 'pins' ? 'bg-[#212429] text-white font-bold' : 'text-[#9CA3AF] hover:text-white'}`}
            >
              Pins
            </button>
            <button
              onClick={() => setDisplayMode('titles')}
              title="Title Badges"
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${displayMode === 'titles' ? 'bg-[#212429] text-white font-bold' : 'text-[#9CA3AF] hover:text-white'}`}
            >
              Titles
            </button>
          </div>
        </div>
      </div>

      {/* Quadrant stats pill bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs font-sans">
        {Object.values(QUADRANT_DEFINITIONS).map((q) => {
          const count = quadrantCounts[q.id] || 0;
          const isActive = quadrantFilter === q.id;
          return (
            <button
              key={q.id}
              onClick={() => setQuadrantFilter(isActive ? 'all' : q.id)}
              className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between
                ${isActive 
                  ? 'ring-2 ring-amber-500 border-amber-500 bg-[#16191F]' 
                  : 'bg-[#0F1115] border-[#212429] hover:border-[#383D47]'
                }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-semibold text-white truncate text-[11px]">
                  {q.title}
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${q.badgeColor}`}>
                  {count}
                </span>
              </div>
              <span className="text-[10px] text-[#9CA3AF] truncate">
                {q.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* Feeling Hashtag Filter Strip */}
      {allHashtags.length > 0 && (
        <div className="bg-[#0F1115] border border-[#212429] rounded-xl p-2.5 flex items-center gap-2 overflow-x-auto text-xs shadow-inner">
          <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold shrink-0 flex items-center gap-1 pl-1">
            <Hash className="w-3 h-3 text-amber-500" />
            Vibe Hashtags:
          </span>
          <button
            onClick={() => setSelectedHashtag('all')}
            className={`px-2.5 py-1 rounded-full text-xs font-mono font-semibold whitespace-nowrap transition-all ${selectedHashtag === 'all' ? 'bg-amber-500 text-black shadow-sm' : 'bg-[#16191F] text-[#9CA3AF] hover:text-white border border-[#212429]'}`}
          >
            #All ({books.length})
          </button>
          {allHashtags.map((ht) => {
            const isSelected = selectedHashtag === ht;
            const count = books.filter((b) => (getBookFeelings(b).hashtags || []).includes(ht)).length;
            return (
              <button
                key={ht}
                onClick={() => setSelectedHashtag(isSelected ? 'all' : ht)}
                className={`px-2.5 py-1 rounded-full text-xs font-mono whitespace-nowrap transition-all border flex items-center gap-1 ${isSelected ? 'bg-amber-500/25 text-amber-300 border-amber-500/60 font-bold' : 'bg-[#16191F] text-[#9CA3AF] border-[#212429] hover:border-[#4B5563] hover:text-white'}`}
              >
                <span>{ht}</span>
                <span className="text-[10px] opacity-75 font-sans">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Notification Toast */}
      {toastMessage && (
        <div className="bg-amber-500/20 border border-amber-500/50 text-amber-300 px-4 py-2 rounded-lg text-xs flex items-center justify-between shadow-lg backdrop-blur-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-amber-400/80 hover:text-white ml-3 font-bold">
            ×
          </button>
        </div>
      )}

      {/* Main Positioning Map 2D Canvas */}
      <div 
        ref={mapContainerRef}
        id="book-positioning-canvas"
        className="relative w-full aspect-[4/3] md:aspect-[16/10] min-h-[460px] bg-[#0A0B0D] border border-[#212429] rounded-2xl overflow-hidden select-none shadow-2xl transition-all"
        style={{ touchAction: 'none' }}
      >
        {/* Subtle 4 Quadrants Background Glow / Tint */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
          {/* Top-Left: Somber & Impressed */}
          <div className="border-r border-b border-[#212429]/60 bg-gradient-to-br from-indigo-950/20 to-transparent p-4 flex flex-col justify-start items-start">
            <div className="bg-[#121520]/80 backdrop-blur-xs border border-indigo-500/20 rounded-lg px-2.5 py-1 text-[10px]">
              <span className="text-indigo-400 font-bold block">Top-Left</span>
              <span className="text-stone-300 font-serif italic text-xs">Profound & Somber Epics</span>
              <span className="text-[9px] text-[#9CA3AF] block">Deeply Moving • Heavy & Philosophical</span>
            </div>
          </div>

          {/* Top-Right: Happy & Impressed */}
          <div className="border-b border-[#212429]/60 bg-gradient-to-bl from-amber-950/20 to-transparent p-4 flex flex-col justify-start items-end text-right">
            <div className="bg-[#1C1810]/80 backdrop-blur-xs border border-amber-500/20 rounded-lg px-2.5 py-1 text-[10px]">
              <span className="text-amber-400 font-bold block">Top-Right</span>
              <span className="text-amber-200 font-serif italic text-xs">Heartwarming Masterpieces</span>
              <span className="text-[9px] text-[#9CA3AF] block">Deeply Moving • Uplifting & Joyful</span>
            </div>
          </div>

          {/* Bottom-Left: Somber & Casual */}
          <div className="border-r border-[#212429]/60 bg-gradient-to-tr from-zinc-950/40 to-transparent p-4 flex flex-col justify-end items-start">
            <div className="bg-[#14161A]/80 backdrop-blur-xs border border-zinc-500/20 rounded-lg px-2.5 py-1 text-[10px]">
              <span className="text-zinc-400 font-bold block">Bottom-Left</span>
              <span className="text-stone-300 font-serif italic text-xs">Dark & Gripping Escapes</span>
              <span className="text-[9px] text-[#9CA3AF] block">Casual & Thrilling • Moody Mysteries</span>
            </div>
          </div>

          {/* Bottom-Right: Happy & Casual */}
          <div className="bg-gradient-to-tl from-emerald-950/20 to-transparent p-4 flex flex-col justify-end items-end text-right">
            <div className="bg-[#101A15]/80 backdrop-blur-xs border border-emerald-500/20 rounded-lg px-2.5 py-1 text-[10px]">
              <span className="text-emerald-400 font-bold block">Bottom-Right</span>
              <span className="text-emerald-200 font-serif italic text-xs">Cozy & Feel-Good Fun</span>
              <span className="text-[9px] text-[#9CA3AF] block">Lighthearted • Relaxing & Sweet</span>
            </div>
          </div>
        </div>

        {/* Coordinate Grid Lines (Subtle reference guides) */}
        <div className="absolute inset-0 pointer-events-none">
          {/* 25%, 50%, 75% subtle grid markers */}
          <div className="absolute left-1/4 top-0 bottom-0 border-l border-white/[0.03]" />
          <div className="absolute left-3/4 top-0 bottom-0 border-l border-white/[0.03]" />
          <div className="absolute top-1/4 left-0 right-0 border-t border-white/[0.03]" />
          <div className="absolute top-3/4 left-0 right-0 border-t border-white/[0.03]" />
        </div>

        {/* Central Axes */}
        {/* Horizontal Axis: Happiness */}
        <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-[#323742] -translate-y-1/2 pointer-events-none flex items-center justify-between px-3">
          <span className="text-[10px] font-mono tracking-wider font-semibold text-[#6B7280] bg-[#0A0B0D]/90 px-2 py-0.5 rounded border border-[#212429]">
            ← Somber / Melancholic / Serious
          </span>
          <span className="text-[10px] font-mono tracking-wider font-semibold text-amber-400/90 bg-[#0A0B0D]/90 px-2 py-0.5 rounded border border-amber-500/30">
            Happy / Joyful / Uplifting →
          </span>
        </div>

        {/* Vertical Axis: Impression Depth */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[1.5px] bg-[#323742] -translate-x-1/2 pointer-events-none flex flex-col justify-between items-center py-3">
          <span className="text-[10px] font-mono tracking-wider font-semibold text-amber-400/90 bg-[#0A0B0D]/90 px-2 py-0.5 rounded border border-amber-500/30 text-center">
            ↑ Deeply Impressed / Moving / Profound
          </span>
          <span className="text-[10px] font-mono tracking-wider font-semibold text-[#6B7280] bg-[#0A0B0D]/90 px-2 py-0.5 rounded border border-[#212429] text-center">
            ↓ Casual / Lighthearted / Breezy
          </span>
        </div>

        {/* Center Zero Origin Pip */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-amber-500/40 bg-[#0A0B0D] flex items-center justify-center pointer-events-none z-10">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        </div>

        {/* Empty state hint if filtered out */}
        {filteredBooks.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 pointer-events-none">
            <Compass className="w-10 h-10 text-[#4B5563] mb-2 animate-spin-slow" />
            <p className="text-white font-serif font-bold text-sm">No books found in this view</p>
            <p className="text-xs text-[#9CA3AF] mt-1">Try clearing your filters or search keywords.</p>
          </div>
        )}

        {/* Plotted Book Nodes */}
        {filteredBooks.map((book) => {
          const isDragging = draggingBookId === book.id;
          const isSelected = selectedMapBook?.id === book.id;
          const feelings = getBookFeelings(book);
          
          // Use live drag coordinates if dragging, else use persisted feelings
          const happiness = isDragging && dragCoords ? dragCoords.x : feelings.happiness;
          const impressed = isDragging && dragCoords ? dragCoords.y : feelings.impressed;
          const pos = getCoordinatesPercent(happiness, impressed);
          const quadrant = getFeelingQuadrant(happiness, impressed);

          return (
            <div
              key={book.id}
              style={{
                left: `${pos.left}%`,
                top: `${pos.top}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: isDragging ? 50 : isSelected ? 40 : 20,
              }}
              onMouseDown={(e) => handleStartDrag(e, book)}
              onTouchStart={(e) => handleStartDrag(e, book)}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMapBook(book);
              }}
              className={`absolute cursor-grab active:cursor-grabbing group transition-transform duration-100 ease-out
                ${isDragging ? 'scale-115' : 'hover:scale-110'}
              `}
            >
              {/* Node Visual Mode: Mini Cover / Pin / Title */}
              {displayMode === 'covers' && (
                <div 
                  className={`relative rounded-md overflow-hidden shadow-xl border-2 transition-all
                    ${isSelected 
                      ? 'border-amber-400 ring-4 ring-amber-500/30' 
                      : 'border-[#2E333D] hover:border-amber-500/70'
                    }`}
                  style={{ width: '42px', height: '62px' }}
                >
                  <BookCover 
                    title={book.title} 
                    author={book.author} 
                    genre={book.genre} 
                    isbn={book.isbn} 
                    size="sm" 
                  />

                  {/* Status Pip */}
                  <div className="absolute top-1 left-1">
                    <span className={`block w-2.5 h-2.5 rounded-full border border-black shadow-sm
                      ${book.status === 'completed' 
                        ? 'bg-emerald-400' 
                        : book.status === 'reading' 
                        ? 'bg-amber-400' 
                        : 'bg-zinc-400'
                      }`} 
                    />
                  </div>

                  {/* Rating Pip */}
                  {book.rating > 0 && (
                    <div className="absolute bottom-1 right-1 bg-black/80 rounded px-1 flex items-center gap-0.5 text-[8px] text-amber-400 font-bold">
                      <Star className="w-2 h-2 fill-amber-400" />
                      <span>{book.rating}</span>
                    </div>
                  )}

                  {book.favorite && (
                    <div className="absolute top-1 right-1 text-rose-400 drop-shadow">
                      <Heart className="w-2.5 h-2.5 fill-rose-500" />
                    </div>
                  )}
                </div>
              )}

              {displayMode === 'pins' && (
                <div className="relative">
                  <div 
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-lg border-2 transition-all
                      ${isSelected 
                        ? 'bg-amber-500 text-black border-white ring-4 ring-amber-500/40' 
                        : 'bg-[#16191F] text-white border-amber-500/60 hover:border-amber-400'
                      }`}
                  >
                    {book.title.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="block text-[9px] text-stone-300 font-sans font-medium text-center truncate max-w-[70px] mt-0.5 bg-black/70 px-1 rounded">
                    {book.title}
                  </span>
                </div>
              )}

              {displayMode === 'titles' && (
                <div 
                  className={`px-2.5 py-1 rounded-full text-xs font-serif font-medium border shadow-lg whitespace-nowrap flex items-center gap-1.5 transition-all
                    ${isSelected
                      ? 'bg-amber-500 text-black border-white font-bold'
                      : 'bg-[#16191F]/90 text-stone-200 border-[#2E333D] hover:border-amber-400'
                    }`}
                >
                  <span className={`w-2 h-2 rounded-full ${book.status === 'completed' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className="max-w-[120px] truncate">{book.title}</span>
                </div>
              )}

              {/* Floating Tooltip during drag or on hover */}
              <div 
                className={`absolute left-1/2 bottom-full -translate-x-1/2 mb-2 pointer-events-none transition-all z-30
                  ${isDragging || isSelected 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'
                  }`}
              >
                <div className="bg-[#16191F] border border-[#2E333D] text-white rounded-xl p-2.5 shadow-2xl whitespace-nowrap min-w-[180px] max-w-[240px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded ${quadrant.badgeColor}`}>
                      {quadrant.title}
                    </span>
                    <span className="text-[10px] text-[#9CA3AF] font-mono">
                      {happiness >= 0 ? `+${happiness}` : happiness}H • {impressed >= 0 ? `+${impressed}` : impressed}I
                    </span>
                  </div>
                  <p className="font-serif font-bold text-xs text-white truncate mt-1">
                    {book.title}
                  </p>
                  <p className="text-[10px] text-[#9CA3AF] truncate">
                    by {book.author}
                  </p>

                  {/* Feeling hashtags & tags preview */}
                  {feelings.hashtags && feelings.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {feelings.hashtags.slice(0, 3).map((ht, i) => (
                        <span key={i} className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded font-mono font-medium">
                          {ht}
                        </span>
                      ))}
                    </div>
                  )}

                  {isDragging && (
                    <p className="text-[9px] text-amber-400 font-mono mt-1.5 flex items-center gap-1 font-semibold">
                      <Move className="w-2.5 h-2.5 animate-pulse" /> Release to set position
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Book Inspector & Quick Actions Bar */}
      {selectedMapBook && (
        <div className="bg-[#12141A] border border-amber-500/30 rounded-xl p-4 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="w-11 h-16 shrink-0 rounded overflow-hidden shadow border border-[#2E333D]">
              <BookCover 
                title={selectedMapBook.title} 
                author={selectedMapBook.author} 
                genre={selectedMapBook.genre} 
                isbn={selectedMapBook.isbn} 
                size="sm" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-white text-sm">
                  {selectedMapBook.title}
                </h3>
                {selectedMapBook.rating > 0 && (
                  <span className="flex items-center text-xs text-amber-400 font-semibold gap-0.5">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {selectedMapBook.rating}/5
                  </span>
                )}
              </div>
              <p className="text-xs text-[#9CA3AF]">
                by {selectedMapBook.author} • <span className="text-stone-300">{selectedMapBook.genre}</span>
              </p>

              {/* Feelings specs */}
              {(() => {
                const feelings = getBookFeelings(selectedMapBook);
                const quad = getFeelingQuadrant(feelings.happiness, feelings.impressed);
                return (
                  <div className="space-y-1.5 mt-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${quad.badgeColor}`}>
                        {quad.title}
                      </span>
                      <span className="text-xs text-stone-300 font-sans">
                        Happiness: <strong className="text-amber-400">{feelings.happiness >= 0 ? `+${feelings.happiness}%` : `${feelings.happiness}%`}</strong>
                      </span>
                      <span className="text-xs text-stone-300 font-sans">
                        Impression: <strong className="text-amber-400">{feelings.impressed >= 0 ? `+${feelings.impressed}%` : `${feelings.impressed}%`}</strong>
                      </span>
                    </div>

                    {/* Feeling Hashtags Pill Row */}
                    {feelings.hashtags && feelings.hashtags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono text-[#6B7280] uppercase">Vibe:</span>
                        {feelings.hashtags.map((ht) => (
                          <button
                            key={ht}
                            onClick={() => setSelectedHashtag(ht)}
                            className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors"
                            title={`Filter map by ${ht}`}
                          >
                            {ht}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Distilled feeling summary */}
                    {feelings.summary && (
                      <p className="text-[11px] font-serif text-[#9CA3AF] italic flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>"{feelings.summary}"</span>
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
            {/* Distinguish with Gemini on-the-fly */}
            <button
              onClick={() => handleDistinguishWithGeminiOnMap(selectedMapBook)}
              disabled={isAnalyzingGemini}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-sans font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Gemini will read user reflections & notes to update emotional coordinates and hashtags"
            >
              {isAnalyzingGemini ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Distinguishing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Distinguish with Gemini</span>
                </>
              )}
            </button>

            {/* Quick adjust nudges */}
            <div className="flex items-center gap-1 bg-[#16191F] border border-[#212429] rounded-lg p-1 text-xs">
              <button
                onClick={() => {
                  const f = getBookFeelings(selectedMapBook);
                  const newF = { ...f, happiness: Math.min(100, f.happiness + 20) };
                  onUpdateBookFeelings(selectedMapBook.id, newF);
                  setSelectedMapBook({ ...selectedMapBook, feelings: newF });
                }}
                className="px-2 py-1 text-[#9CA3AF] hover:text-white hover:bg-[#212429] rounded"
                title="Make happier / more uplifting"
              >
                😊 More Happy (+20%)
              </button>
              <button
                onClick={() => {
                  const f = getBookFeelings(selectedMapBook);
                  const newF = { ...f, impressed: Math.min(100, f.impressed + 20) };
                  onUpdateBookFeelings(selectedMapBook.id, newF);
                  setSelectedMapBook({ ...selectedMapBook, feelings: newF });
                }}
                className="px-2 py-1 text-[#9CA3AF] hover:text-white hover:bg-[#212429] rounded"
                title="Make more deeply impressive"
              >
                🥹 More Impressed (+20%)
              </button>
            </div>

            <button
              onClick={() => onSelectBook(selectedMapBook)}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-sm font-sans"
            >
              <span>Edit Journal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
