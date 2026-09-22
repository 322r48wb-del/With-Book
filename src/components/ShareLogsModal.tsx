/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  FileText, 
  Sparkles, 
  Download, 
  BookOpen, 
  Trophy, 
  Quote, 
  Compass, 
  Send,
  Smartphone,
  BookMarked
} from 'lucide-react';
import { Book } from '../types';
import { getBookFeelings, getFeelingQuadrant } from '../utils/feelingUtils';
import BookCover from './BookCover';

interface ShareLogsModalProps {
  library: Book[];
  readingGoal: number;
  initialBook?: Book | null;
  onClose: () => void;
}

export default function ShareLogsModal({ library, readingGoal, initialBook, onClose }: ShareLogsModalProps) {
  // Share mode: 'all' or 'single'
  const [shareMode, setShareMode] = useState<'all' | 'single'>(initialBook ? 'single' : 'all');
  const [selectedBookId, setSelectedBookId] = useState<string>(initialBook?.id || library[0]?.id || '');
  const [readerName, setReaderName] = useState<string>('Avid Reader');
  const [personalNote, setPersonalNote] = useState<string>('');
  
  // Link state
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isGeneratingLink, setIsGeneratingLink] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [shareSuccessMessage, setShareSuccessMessage] = useState<string | null>(null);

  // Active single book if single mode selected
  const activeBook = library.find(b => b.id === selectedBookId) || library[0] || null;

  // Derive stats
  const completedCount = library.filter(b => b.status === 'completed').length;
  const readingCount = library.filter(b => b.status === 'reading').length;
  const topRatedBooks = [...library].sort((a, b) => b.rating - a.rating).slice(0, 3);
  
  // Collect a memorable quote from the library or active book
  const featuredQuote = activeBook?.keyQuotes && activeBook.keyQuotes.length > 0
    ? activeBook.keyQuotes[0]
    : library.flatMap(b => b.keyQuotes || [])[0] || null;

  // Generate shareable link
  useEffect(() => {
    let isMounted = true;
    const createLink = async () => {
      setIsGeneratingLink(true);
      const booksToShare = shareMode === 'single' && activeBook ? [activeBook] : library;

      try {
        const res = await fetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            books: booksToShare,
            readingGoal,
            readerName,
            shareNote: personalNote,
            singleBookId: shareMode === 'single' && activeBook ? activeBook.id : undefined,
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.shareUrl) {
            setShareUrl(data.shareUrl);
            return;
          }
        }
      } catch (err) {
        console.warn('Backend share error, using client URL fallback:', err);
      }

      // Safe client-side fallback encoding
      try {
        const payload = {
          readerName,
          readingGoal,
          books: booksToShare.map(b => ({
            id: b.id,
            title: b.title,
            author: b.author,
            genre: b.genre,
            rating: b.rating,
            status: b.status,
            userNotes: b.userNotes?.slice(0, 200),
            keyQuotes: b.keyQuotes?.slice(0, 2),
            feelings: b.feelings,
            dateAdded: b.dateAdded,
          }))
        };
        const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(payload)))));
        const fallbackUrl = `${window.location.origin}${window.location.pathname}?shared_data=${encoded}`;
        if (isMounted) setShareUrl(fallbackUrl);
      } catch (e) {
        if (isMounted) setShareUrl(window.location.href);
      } finally {
        if (isMounted) setIsGeneratingLink(false);
      }
    };

    createLink();

    return () => {
      isMounted = false;
    };
  }, [shareMode, selectedBookId, readerName, personalNote, library, readingGoal]);

  // Generate formatted plain text / markdown for social & chat sharing
  const generateFormattedSummary = (): string => {
    if (shareMode === 'single' && activeBook) {
      const feelings = getBookFeelings(activeBook);
      const quad = getFeelingQuadrant(feelings.happiness, feelings.impressed);
      const stars = '★'.repeat(activeBook.rating) + '☆'.repeat(Math.max(0, 5 - activeBook.rating));
      const hashtags = feelings.hashtags?.length ? feelings.hashtags.join(' ') : '#ReadingJournal #BookReview';
      const quoteText = activeBook.keyQuotes && activeBook.keyQuotes.length > 0 
        ? `\n💬 Key Quote: "${activeBook.keyQuotes[0]}"` 
        : '';
      const notesText = activeBook.userNotes ? `\n📝 Reflections: "${activeBook.userNotes}"` : '';

      return `📖 Reading Log: "${activeBook.title}" by ${activeBook.author}
Status: ${activeBook.status.toUpperCase()} | Rating: ${stars} (${activeBook.rating}/5)
Genre: ${activeBook.genre}
🧭 Emotional Vibe: ${quad.title} (${feelings.happiness >= 0 ? '+' : ''}${feelings.happiness}H, ${feelings.impressed >= 0 ? '+' : ''}${feelings.impressed}I)
${hashtags}${quoteText}${notesText}

Shared by ${readerName} via WITH BOOK 📚
🔗 Read full log: ${shareUrl || window.location.href}`;
    }

    // Entire library summary
    const completedStr = `${completedCount}/${readingGoal} books completed (${Math.round((completedCount / (readingGoal || 1)) * 100)}%)`;
    const topHighlights = topRatedBooks
      .map(b => `• "${b.title}" by ${b.author} (${b.rating}/5★)`)
      .join('\n');
    const quoteStr = featuredQuote ? `\n💬 Favorite Quote:\n"${featuredQuote}"\n` : '';

    return `📚 My Reading Log & Journey on WITH BOOK
👤 Reader: ${readerName}
🎯 2026 Reading Target: ${completedStr}
📖 Currently Reading: ${readingCount} book${readingCount === 1 ? '' : 's'}

⭐ Highlights & Favorites:
${topHighlights || '• Just started building my reading shelves!'}
${quoteStr}
${personalNote ? `💭 Note: "${personalNote}"\n` : ''}
🔗 Explore my complete reading shelf & emotional map:
${shareUrl || window.location.href}`;
  };

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    });
  };

  const handleCopyFormattedText = () => {
    const text = generateFormattedSummary();
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 3000);
    });
  };

  const handleNativeShare = async () => {
    const text = generateFormattedSummary();
    const title = shareMode === 'single' && activeBook 
      ? `Reading Log: ${activeBook.title} - WITH BOOK` 
      : `${readerName}'s Reading Journey - WITH BOOK`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: shareUrl || window.location.href,
        });
        setShareSuccessMessage('Shared successfully!');
        setTimeout(() => setShareSuccessMessage(null), 3000);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadBackup = () => {
    const booksToExport = shareMode === 'single' && activeBook ? [activeBook] : library;
    const exportData = {
      exportedAt: new Date().toISOString(),
      readerName,
      readingGoal,
      books: booksToExport
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `withbook-reading-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
      <div className="bg-[#0F1115] rounded-xl border border-[#212429] shadow-2xl max-w-xl w-full max-h-[92vh] overflow-hidden flex flex-col transition-all duration-300">
        
        {/* Header toolbar */}
        <div className="px-6 py-4 border-b border-[#212429] bg-[#16191F] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-white text-base leading-tight">
                Share Reading Logs
              </h2>
              <p className="text-[11px] text-[#9CA3AF] font-sans">
                Share your reading journey, personal reviews, and quotes with friends
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#9CA3AF] hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Share mode selector tabs */}
          <div className="flex items-center bg-[#16191F] border border-[#212429] rounded-xl p-1 text-xs">
            <button
              onClick={() => setShareMode('all')}
              className={`flex-1 py-2 rounded-lg font-sans font-semibold transition-all flex items-center justify-center gap-2 ${shareMode === 'all' ? 'bg-amber-500 text-black font-bold shadow-sm' : 'text-[#9CA3AF] hover:text-white'}`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Full Library ({library.length} books)</span>
            </button>
            <button
              onClick={() => setShareMode('single')}
              className={`flex-1 py-2 rounded-lg font-sans font-semibold transition-all flex items-center justify-center gap-2 ${shareMode === 'single' ? 'bg-amber-500 text-black font-bold shadow-sm' : 'text-[#9CA3AF] hover:text-white'}`}
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span>Specific Book Log</span>
            </button>
          </div>

          {/* Book selector if single mode */}
          {shareMode === 'single' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono tracking-wider text-[#6B7280] uppercase block">
                SELECT BOOK TO SHARE
              </label>
              <select
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                className="w-full text-xs bg-[#16191F] text-white border border-[#212429] rounded-lg py-2 px-3 font-sans focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {library.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} — by {b.author} ({b.status === 'completed' ? 'Done' : b.status === 'reading' ? 'Reading' : 'To Read'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reader Profile Name input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono tracking-wider text-[#6B7280] uppercase block mb-1">
                YOUR READER NAME
              </label>
              <input
                type="text"
                value={readerName}
                onChange={(e) => setReaderName(e.target.value)}
                placeholder="e.g. Alex, Booklover99"
                className="w-full px-3 py-1.5 text-xs bg-[#16191F] border border-[#212429] text-white placeholder-[#6B7280] rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono tracking-wider text-[#6B7280] uppercase block mb-1">
                OPTIONAL MESSAGE / NOTE
              </label>
              <input
                type="text"
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
                placeholder="e.g. Check out my 2026 reading favorites!"
                className="w-full px-3 py-1.5 text-xs bg-[#16191F] border border-[#212429] text-white placeholder-[#6B7280] rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Shareable Link Box */}
          <div className="bg-[#16191F] border border-[#212429] rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-semibold tracking-wider text-amber-500 uppercase flex items-center gap-1.5">
                <Share2 className="w-3 h-3" />
                SHAREABLE WEB LINK
              </span>
              {copiedLink && (
                <span className="text-[10px] text-emerald-400 font-mono font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" /> Copied to clipboard!
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={isGeneratingLink ? 'Generating share link...' : shareUrl}
                className="flex-1 px-3 py-2 text-xs font-mono bg-[#0A0B0D] border border-[#212429] text-[#9CA3AF] rounded-lg select-all focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                disabled={!shareUrl}
                className="px-3.5 py-2 text-xs font-sans font-semibold text-black bg-amber-500 hover:bg-amber-400 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 font-bold shadow-sm"
                title="Copy shareable link"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>

            {/* Action buttons: Open preview / Native device share */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={handleNativeShare}
                className="px-3 py-1.5 text-xs font-sans text-white bg-[#212429] hover:bg-[#2A2E35] rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>Share via App...</span>
              </button>

              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 text-xs font-sans text-[#9CA3AF] hover:text-white bg-transparent hover:bg-[#212429] rounded-lg transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Test Link in New Tab</span>
              </a>

              {shareSuccessMessage && (
                <span className="text-xs text-emerald-400 font-mono ml-auto">
                  {shareSuccessMessage}
                </span>
              )}
            </div>
          </div>

          {/* Visual Digital Reading Passport / Card Preview */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono tracking-wider text-[#6B7280] uppercase block">
              CARD PREVIEW & FORMATTED SOCIAL POST
            </span>
            
            <div className="bg-[#12151B] border border-[#212429] rounded-xl p-4 relative overflow-hidden group">
              {/* Subtle aesthetic accent watermark */}
              <div className="absolute right-3 top-3 text-[9px] font-mono text-amber-500/30 uppercase tracking-widest border border-amber-500/20 px-2 py-0.5 rounded">
                WITH BOOK • PASSPORT
              </div>

              {shareMode === 'single' && activeBook ? (
                <div className="flex gap-4 items-start">
                  <div className="shrink-0">
                    <BookCover title={activeBook.title} author={activeBook.author} genre={activeBook.genre} isbn={activeBook.isbn} size="sm" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-serif font-bold text-white truncate">
                        {activeBook.title}
                      </span>
                      <span className="text-[10px] text-amber-500">
                        {'★'.repeat(activeBook.rating)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#9CA3AF] font-sans">
                      by {activeBook.author} • <span className="text-stone-400">{activeBook.genre}</span>
                    </p>

                    {/* Feelings badge */}
                    {(() => {
                      const f = getBookFeelings(activeBook);
                      const q = getFeelingQuadrant(f.happiness, f.impressed);
                      return (
                        <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono">
                          <span className={`px-1.5 py-0.2 rounded font-semibold ${q.badgeColor}`}>
                            {q.title}
                          </span>
                          {f.hashtags && f.hashtags.slice(0, 2).map((h, i) => (
                            <span key={i} className="text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded">
                              {h}
                            </span>
                          ))}
                        </div>
                      );
                    })()}

                    {activeBook.userNotes && (
                      <p className="text-[11px] font-serif italic text-stone-300 line-clamp-2 border-l border-[#212429] pl-2 mt-1">
                        "{activeBook.userNotes}"
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[#212429] pb-2">
                    <div>
                      <h4 className="font-serif font-bold text-white text-sm">
                        {readerName}'s Reading Journey
                      </h4>
                      <p className="text-[10px] font-mono text-[#9CA3AF]">
                        {library.length} books logged • {completedCount} finished
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded text-amber-400 font-mono text-[10px]">
                      <Trophy className="w-3 h-3" />
                      <span>{Math.round((completedCount / (readingGoal || 1)) * 100)}% Goal</span>
                    </div>
                  </div>

                  {topRatedBooks.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-[#6B7280] uppercase tracking-wider block">
                        TOP RATED SHELVES
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {topRatedBooks.map(b => (
                          <span key={b.id} className="text-[10px] font-sans text-stone-300 bg-[#1A1E26] px-2 py-0.5 rounded border border-[#212429] flex items-center gap-1">
                            <span>{b.title}</span>
                            <span className="text-amber-500 font-mono text-[9px]">{b.rating}★</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {featuredQuote && (
                    <div className="text-[11px] font-serif italic text-stone-300 border-l-2 border-amber-500/50 pl-2.5 py-0.5">
                      "{featuredQuote}"
                    </div>
                  )}
                </div>
              )}

              {/* Bottom copy formatted text button */}
              <div className="mt-3 pt-3 border-t border-[#212429] flex items-center justify-between">
                <span className="text-[10px] text-[#6B7280] font-sans">
                  Ready for Discord, WhatsApp, Twitter/X, Instagram
                </span>
                <button
                  onClick={handleCopyFormattedText}
                  className="px-3 py-1 text-xs font-sans font-semibold text-stone-200 hover:text-white bg-[#1A1E26] hover:bg-[#252A36] border border-[#212429] rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileText className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{copiedText ? 'Copied Text!' : 'Copy Summary Text'}</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-[#212429] bg-[#16191F] flex items-center justify-between">
          <button
            onClick={handleDownloadBackup}
            className="text-xs text-[#9CA3AF] hover:text-stone-200 flex items-center gap-1.5 font-sans"
            title="Download JSON export file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Backup File (.json)</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-sans font-semibold text-[#9CA3AF] hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleCopyLink}
              className="px-5 py-2 text-xs font-sans font-bold text-black bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Share Link'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
