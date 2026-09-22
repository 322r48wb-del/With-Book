/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Plus, Check, Loader2, Star, User, Search, RefreshCw, BookOpen, AlertCircle } from 'lucide-react';
import { Book, ReadingStatus } from '../types';

interface FavoriteAuthorReleasesProps {
  library: Book[];
  onAddBook: (book: Omit<Book, 'id' | 'dateAdded'>) => void;
}

interface NewRelease {
  title: string;
  author: string;
  releaseDate: string;
  description: string;
  whyYouWillLoveIt: string;
  genre: string;
  pageCount: number;
  isbn: string;
}

export default function FavoriteAuthorReleases({ library, onAddBook }: FavoriteAuthorReleasesProps) {
  const [detectedAuthors, setDetectedAuthors] = useState<string[]>([]);
  const [customAuthor, setCustomAuthor] = useState('');
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [releases, setReleases] = useState<NewRelease[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [addedIsbns, setAddedIsbns] = useState<Record<string, boolean>>({});

  // Cycle fun loading messages
  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 4);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const loadingMessages = [
    'Scouting literary journals & publishing schedules...',
    'Consulting book indices and press announcements...',
    'Matching recent book covers and pre-order records...',
    'Formatting your exclusive author report...',
  ];

  // Scan library to extract favorite authors (rating >= 4 or marked as favorite)
  useEffect(() => {
    const authorsSet = new Set<string>();
    
    library.forEach((book) => {
      if (book.favorite || book.rating >= 4) {
        const cleanAuthor = book.author.trim();
        if (cleanAuthor && cleanAuthor.toLowerCase() !== 'unknown') {
          authorsSet.add(cleanAuthor);
        }
      }
    });

    const list = Array.from(authorsSet);
    setDetectedAuthors(list);

    // Default selection is top 2 detected authors, or fallback popular ones if none detected
    if (list.length > 0) {
      setSelectedAuthors(list.slice(0, 2));
    } else {
      setSelectedAuthors(['Haruki Murakami', 'Brandon Sanderson']);
    }
  }, [library]);

  // Load previously fetched releases from localStorage to avoid unnecessary API calls
  useEffect(() => {
    const saved = localStorage.getItem('withbook_author_releases');
    if (saved) {
      try {
        setReleases(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const fetchReleases = async (authorsToQuery: string[]) => {
    if (authorsToQuery.length === 0) {
      setError('Please select or specify at least one author to look up.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setLoadingStep(0);

    try {
      const res = await fetch('/api/ai/favorite-author-releases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ authors: authorsToQuery }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to search new releases');
      }

      const data = await res.json();
      if (data.releases && Array.isArray(data.releases)) {
        setReleases(data.releases);
        localStorage.setItem('withbook_author_releases', JSON.stringify(data.releases));
        setSuccessMsg(`Discovered ${data.releases.length} releases by ${authorsToQuery.join(', ')}!`);
      } else {
        throw new Error('Could not parse release records. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while calling the Gemini Search engine.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomAuthorSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const name = customAuthor.trim();
    if (!name) return;

    // Add to selection and trigger fetch
    setSelectedAuthors([name]);
    fetchReleases([name]);
    setCustomAuthor('');
  };

  const toggleAuthorSelection = (author: string) => {
    setSelectedAuthors((prev) => {
      const isSelected = prev.includes(author);
      if (isSelected) {
        return prev.filter((a) => a !== author);
      } else {
        return [...prev, author];
      }
    });
  };

  const handleAddReleaseToWishlist = (release: NewRelease) => {
    // Check if book already added
    const alreadyExists = library.some(
      (b) => b.title.toLowerCase() === release.title.toLowerCase() || (release.isbn && b.isbn === release.isbn)
    );

    if (alreadyExists) {
      alert(`"${release.title}" is already in your reading log!`);
      return;
    }

    onAddBook({
      title: release.title,
      author: release.author,
      genre: release.genre,
      cover: `https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=300`, // beautiful abstract book background fallback
      description: release.description,
      isbn: release.isbn,
      userNotes: `Discovered as a newly released masterpiece by ${release.author}.`,
      rating: 0,
      status: 'to-read',
      favorite: false,
    });

    setAddedIsbns((prev) => ({ ...prev, [release.isbn]: true }));
    setTimeout(() => {
      setAddedIsbns((prev) => ({ ...prev, [release.isbn]: false }));
    }, 3000);
  };

  return (
    <div id="favorite-author-releases" className="bg-[#0F1115] rounded-xl border border-[#212429] shadow-md p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-500" />
          <h3 className="font-serif font-semibold text-lg tracking-tight text-white">
            Favorite Authors' New Releases
          </h3>
        </div>
        <button
          onClick={() => fetchReleases(selectedAuthors)}
          disabled={loading || selectedAuthors.length === 0}
          className="flex items-center gap-1 bg-[#16191F] hover:bg-[#212429] border border-[#212429] hover:border-amber-500/30 text-stone-300 disabled:opacity-40 text-xs px-2.5 py-1.5 rounded-lg transition-all font-mono"
          title="Refresh newest announcements and publications"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-500' : ''}`} />
          SYNC RELEASES
        </button>
      </div>

      <p className="text-[#9CA3AF] text-xs leading-relaxed mb-4">
        Track down newly published and upcoming books by the writers you love. Powered by real-time Google Search grounding.
      </p>

      {/* Author Detection and Setup Panel */}
      <div className="bg-[#16191F]/50 border border-[#212429] p-4 rounded-lg mb-5 space-y-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-[#6B7280] uppercase block mb-2">
            SELECT AUTHORS TO MONITOR
          </span>
          {detectedAuthors.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {detectedAuthors.map((author) => {
                const isSelected = selectedAuthors.includes(author);
                return (
                  <button
                    key={author}
                    onClick={() => toggleAuthorSelection(author)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-all flex items-center gap-1
                      ${isSelected 
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 font-medium' 
                        : 'bg-[#0F1115] border-[#212429] text-stone-400 hover:text-white'
                      }`}
                  >
                    <User className="w-3 h-3" />
                    {author}
                    {isSelected && <Check className="w-2.5 h-2.5 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-[11px] text-stone-500 italic">
              No favorite authors identified in your reading logs yet (rate books 4+ stars or mark them as favorite!). Monitoring default selections.
            </div>
          )}
        </div>

        {/* Custom Author Search Input */}
        <form onSubmit={handleCustomAuthorSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500" />
            <input
              type="text"
              placeholder="Search release logs for another author (e.g. Stephen King)..."
              value={customAuthor}
              onChange={(e) => setCustomAuthor(e.target.value)}
              className="w-full bg-[#0F1115] border border-[#212429] focus:border-amber-500/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-stone-600 outline-none transition-colors font-sans"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !customAuthor.trim()}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-45 text-black font-bold text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
          >
            Look Up
          </button>
        </form>
      </div>

      {/* Notifications Banners */}
      {error && (
        <div className="p-3.5 mb-4 text-xs bg-rose-950/40 text-rose-300 border border-rose-900/30 rounded-lg space-y-1.5 animate-fade-in">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
          {error.toLowerCase().includes('api key') && (
            <p className="text-[11px] text-stone-300 leading-normal border-t border-rose-900/30 pt-2 pl-6">
              💡 <strong>API Key Setup:</strong> Open <strong>Settings &gt; Secrets</strong> in AI Studio and add your <code className="text-amber-400 bg-black/40 px-1 py-0.5 rounded">GEMINI_API_KEY</code>.
            </p>
          )}
        </div>
      )}

      {successMsg && (
        <div className="p-3 mb-4 text-xs bg-emerald-950/40 text-emerald-300 border border-emerald-900/30 rounded-lg flex items-start gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Loading Oracle State */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-center gap-3 bg-[#16191F]/40 border border-[#212429] rounded-lg">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-mono font-medium text-amber-500 tracking-widest uppercase">
              SCANNING WEB RECORDS...
            </span>
            <span className="text-[#9CA3AF] text-xs italic font-serif px-6 transition-opacity duration-500 max-w-sm">
              {loadingMessages[loadingStep]}
            </span>
          </div>
        </div>
      ) : releases.length > 0 ? (
        /* Results list */
        <div className="space-y-4">
          <div className="text-[10px] font-mono tracking-widest text-[#6B7280] uppercase mb-1">
            NEWEST & UPCOMING PUBLICATIONS
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {releases.map((release, idx) => {
              const isAdded = addedIsbns[release.isbn];
              return (
                <div key={idx} className="bg-[#16191F] rounded-lg border border-[#212429] p-4 flex flex-col justify-between transition-all hover:border-[#31353D]">
                  <div>
                    {/* Header: Date + Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] bg-[#212429] text-stone-300 font-sans px-2 py-0.5 rounded flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3 text-amber-500" />
                        {release.releaseDate}
                      </span>
                      <span className="text-[10px] text-stone-500 uppercase font-mono tracking-wider">
                        {release.genre}
                      </span>
                    </div>

                    {/* Book Details */}
                    <h4 className="font-serif font-bold text-sm text-white leading-tight mb-0.5">
                      {release.title}
                    </h4>
                    <p className="text-xs text-stone-400 mb-2">by {release.author}</p>

                    {/* Synopsis */}
                    <p className="text-[11px] text-[#9CA3AF] leading-relaxed line-clamp-3 mb-3">
                      {release.description}
                    </p>

                    {/* Personal Connection Reason */}
                    <div className="bg-[#0F1115] border-l-2 border-amber-500 p-2 rounded-r mb-3">
                      <span className="text-[8px] font-mono text-[#6B7280] uppercase block tracking-wider font-bold mb-0.5">
                        WHY YOU WILL LOVE IT
                      </span>
                      <p className="text-[10px] text-[#E0E2E6] italic leading-normal">
                        "{release.whyYouWillLoveIt}"
                      </p>
                    </div>
                  </div>

                  {/* Add action */}
                  <button
                    onClick={() => handleAddReleaseToWishlist(release)}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all
                      ${isAdded
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 cursor-default'
                        : 'bg-white hover:bg-stone-200 text-black shadow-sm'
                      }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Added to Wishlist!
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        Add to Wishlist
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty recommendation list */
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-[#212429] rounded-lg bg-[#16191F]/30">
          <Sparkles className="w-8 h-8 text-[#4B5563] mb-2" />
          <p className="text-[#6B7280] text-xs font-serif italic mb-4 max-w-sm leading-relaxed">
            "No announcements loaded. Select authors to track or input a custom name, and let the oracle query live literary indices."
          </p>
          <button
            onClick={() => fetchReleases(selectedAuthors)}
            disabled={selectedAuthors.length === 0}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-black text-xs font-bold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Discover New Book Announcements
          </button>
        </div>
      )}
    </div>
  );
}
