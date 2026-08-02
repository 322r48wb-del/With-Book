/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, Clock, Heart, Star, Search, SlidersHorizontal, BarChart3, Trophy, BookMarked, Info, Settings, X, Cloud } from 'lucide-react';
import { Book, ReadingStatus, AIRecommendation } from './types';
import BookCover from './components/BookCover';
import ScannerAndSearch from './components/ScannerAndSearch';
import AIRecommendCard from './components/AIRecommendCard';
import BookDetailModal from './components/BookDetailModal';
import GoogleDriveSync from './components/GoogleDriveSync';
import FavoriteAuthorReleases from './components/FavoriteAuthorReleases';
import ChatCorner from './components/ChatCorner';
import HighlightText from './components/HighlightText';

// Pre-seeded library items for a luxurious, lived-in feel on first load
const INITIAL_LIBRARY_SEEDS: Book[] = [
  {
    id: 'seed-1',
    title: 'Dune',
    author: 'Frank Herbert',
    genre: 'Sci-Fi',
    cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1555447414i/44767458.jpg',
    isbn: '9780441172719',
    description: 'Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, who would become the mysterious man known as Muad\'Dib.',
    userNotes: 'Incredible grand worldbuilding! The ecological message and planetary politics are fascinating. However, I found the pace slightly slower in the middle act, especially around Arrakeen. The prose is deeply philosophical.',
    rating: 4,
    status: 'completed',
    dateAdded: '2026-06-15',
    dateStarted: '2026-06-16',
    dateCompleted: '2026-06-30',
    favorite: true,
    keyQuotes: [
      'Fear is the mind-killer.',
      'There is no escape—we pay for the violence of our ancestors.'
    ]
  },
  {
    id: 'seed-2',
    title: 'The Silent Patient',
    author: 'Alex Michaelides',
    genre: 'Thriller',
    cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1668782119i/40024119.jpg',
    isbn: '9781250301697',
    description: 'Alicia Berenson’s life is seemingly perfect. One evening her husband Gabriel returns home late from a fashion shoot, and Alicia shoots him five times in the face, and then never speaks another word.',
    userNotes: 'Whoa! Absolute page-turner. I literally read it in two massive late-night sittings. That twist at the very end completely caught me off guard. Highly recommend to anyone looking for a tight psychological puzzle!',
    rating: 5,
    status: 'completed',
    dateAdded: '2026-07-01',
    dateStarted: '2026-07-01',
    dateCompleted: '2026-07-03',
    favorite: false,
    keyQuotes: [
      'We are all crazy, I believe, just in different ways.',
      'An unexpressed emotion will never die.'
    ]
  },
  {
    id: 'seed-3',
    title: 'Atomic Habits',
    author: 'James Clear',
    genre: 'Self-Help',
    cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1655998315i/40121378.jpg',
    isbn: '9780735211292',
    description: 'No matter your goals, Atomic Habits offers a proven framework for improving—every day. James Clear, one of the world\'s leading experts on habit formation, reveals practical strategies.',
    userNotes: 'Extremely practical workflow guidelines. The idea of "1% better every day" is so logical. Currently building a reading habit system using these rules: placing my current book right on my pillow every morning to trigger reading before bed!',
    rating: 4,
    status: 'reading',
    dateAdded: '2026-07-08',
    dateStarted: '2026-07-08',
    favorite: true,
    keyQuotes: [
      'You do not rise to the level of your goals. You fall to the level of your systems.',
      'Every action you take is a vote for the type of person you wish to become.'
    ]
  }
];

export default function App() {
  const [library, setLibrary] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | ReadingStatus | 'favorites'>('all');
  const [sortBy, setSortBy] = useState<'dateAdded' | 'rating'>('dateAdded');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Custom reading target goals
  const [readingGoal, setReadingGoal] = useState<number>(12);
  const [goalEditing, setGoalEditing] = useState(false);

  // Load books from localStorage or seed initial logs on start
  useEffect(() => {
    const saved = localStorage.getItem('withbook_library');
    if (saved) {
      try {
        setLibrary(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load library logs from storage', e);
        setLibrary(INITIAL_LIBRARY_SEEDS);
      }
    } else {
      setLibrary(INITIAL_LIBRARY_SEEDS);
      localStorage.setItem('withbook_library', JSON.stringify(INITIAL_LIBRARY_SEEDS));
    }

    // Load custom goal
    const savedGoal = localStorage.getItem('withbook_reading_goal');
    if (savedGoal) {
      const parsed = parseInt(savedGoal, 10);
      if (!isNaN(parsed)) setReadingGoal(parsed);
    }
  }, []);

  // Save changes helper
  const saveLibraryState = (newLib: Book[]) => {
    setLibrary(newLib);
    localStorage.setItem('withbook_library', JSON.stringify(newLib));
  };

  // Add Book action (triggered from scanner or manual search list)
  const handleAddBook = (bookMeta: Omit<Book, 'id' | 'dateAdded' | 'userNotes' | 'rating' | 'status' | 'favorite'>) => {
    const newBook: Book = {
      ...bookMeta,
      id: `book-${Date.now()}`,
      status: 'to-read',
      userNotes: '',
      rating: 0,
      favorite: false,
      dateAdded: new Date().toISOString().split('T')[0],
      keyQuotes: []
    };
    const updated = [newBook, ...(library || [])];
    saveLibraryState(updated);
    // Automatically trigger notes opening to let them review
    setSelectedBook(newBook);
  };

  // Add highly targeted recommended books
  const handleAddRecommendation = (rec: AIRecommendation) => {
    // Check if recommendation is already added to prevent duplicates
    if ((library || []).some(b => b?.title?.toLowerCase() === rec.title?.toLowerCase())) {
      alert(`"${rec.title}" is already in your reading log!`);
      return;
    }

    const newBook: Book = {
      id: `rec-${Date.now()}`,
      title: rec.title,
      author: rec.author,
      genre: rec.genre,
      cover: '', // uses beautiful CSS fallback cover automatically
      description: `Gemini recommended: "${rec.reason}"`,
      userNotes: `Discovered via Gemini AI Suggestion: "Perfect for me because ${rec.reason?.slice(0, 100)}..."`,
      rating: 0,
      status: 'to-read',
      favorite: false,
      dateAdded: new Date().toISOString().split('T')[0],
      keyQuotes: []
    };
    const updated = [newBook, ...(library || [])];
    saveLibraryState(updated);
    setSelectedBook(newBook);
  };

  const handleAddNewRelease = (release: Omit<Book, 'id' | 'dateAdded'>) => {
    const newBook: Book = {
      ...release,
      id: `release-${Date.now()}`,
      dateAdded: new Date().toISOString().split('T')[0],
      keyQuotes: []
    };
    const updated = [newBook, ...(library || [])];
    saveLibraryState(updated);
    setSelectedBook(newBook);
  };

  // Save specific book updates inside the modal
  const handleSaveBookDetails = (updatedBook: Book) => {
    const updated = (library || []).map((b) => (b.id === updatedBook.id ? updatedBook : b));
    saveLibraryState(updated);
  };

  // Delete book from logs
  const handleDeleteBook = (id: string) => {
    const updated = (library || []).filter((b) => b.id !== id);
    saveLibraryState(updated);
  };

  // Handle Reading target goal update
  const handleSaveGoal = (val: string) => {
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setReadingGoal(parsed);
      localStorage.setItem('withbook_reading_goal', parsed.toString());
    }
    setGoalEditing(false);
  };

  // Calculate statistics
  const safeLibrary = library || [];
  const totalBooks = safeLibrary.length;
  const readingCount = safeLibrary.filter((b) => b?.status === 'reading').length;
  const completedCount = safeLibrary.filter((b) => b?.status === 'completed').length;
  const wishlistCount = safeLibrary.filter((b) => b?.status === 'to-read').length;
  const favoriteCount = safeLibrary.filter((b) => b?.favorite).length;

  // Filter & search criteria
  const processedBooks = safeLibrary
    .filter((book) => {
      if (!book) return false;
      // Tab filters
      if (activeTab === 'reading') return book.status === 'reading';
      if (activeTab === 'to-read') return book.status === 'to-read';
      if (activeTab === 'completed') return book.status === 'completed';
      if (activeTab === 'favorites') return book.favorite;
      return true;
    })
    .filter((book) => {
      // Text search matching title or author or notes or genre or quotes or description
      const term = searchFilter.toLowerCase().trim();
      if (!term) return true;

      const matchQuotes = Array.isArray(book.keyQuotes)
        ? book.keyQuotes.some((q) => q?.toLowerCase().includes(term))
        : false;
      const matchDesc = book.description?.toLowerCase().includes(term);

      return (
        book.title?.toLowerCase().includes(term) ||
        book.author?.toLowerCase().includes(term) ||
        book.genre?.toLowerCase().includes(term) ||
        (book.userNotes && book.userNotes.toLowerCase().includes(term)) ||
        Boolean(matchQuotes) ||
        Boolean(matchDesc)
      );
    })
    .sort((a, b) => {
      // Sorting rule
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      // default: latest dateAdded first
      return new Date(b.dateAdded || 0).getTime() - new Date(a.dateAdded || 0).getTime();
    });

  return (
    <div id="app-container" className="min-h-screen flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 selection:bg-amber-500/30">
      {/* Header section with brand typography */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#212429] pb-6 mb-8 gap-4">
        <div>
          <h1 className="font-sans font-light tracking-[0.2em] uppercase text-white text-2xl sm:text-3xl select-none flex items-center gap-1.5">
            WITH <span className="font-bold italic text-amber-500">BOOK</span> <span className="text-xl">📚</span>
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-[#6B7280] mt-1 sm:mt-1.5">
            Scan. Reflect. Discover. — Your elegant personal reading companion.
          </p>
        </div>

        {/* Dashboard Quick Stats */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#16191F] border border-[#212429] rounded-lg px-3 py-2 text-center shadow-md">
            <span className="text-[9px] font-mono tracking-wider uppercase text-[#6B7280] block">
              LOGGED
            </span>
            <span className="font-sans font-bold text-base text-white">
              {totalBooks}
            </span>
          </div>

          <div className="bg-[#16191F] border border-[#212429] rounded-lg px-3 py-2 text-center shadow-md">
            <span className="text-[9px] font-mono tracking-wider uppercase text-[#6B7280] block">
              READING
            </span>
            <span className="font-sans font-bold text-base text-amber-500">
              {readingCount}
            </span>
          </div>

          <div className="bg-[#16191F] border border-[#212429] rounded-lg px-3 py-2 text-center shadow-md">
            <span className="text-[9px] font-mono tracking-wider uppercase text-[#6B7280] block">
              COMPLETED
            </span>
            <span className="font-sans font-bold text-base text-emerald-500">
              {completedCount}
            </span>
          </div>

          {/* Gamified reading goal target tracking widget */}
          <div className="bg-[#16191F] border border-[#212429] rounded-lg px-4 py-2 text-left shadow-md flex items-center gap-3 relative">
            <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <span className="text-[8px] font-mono tracking-wider uppercase text-[#6B7280] block">
                ANNUAL TARGET
              </span>
              <div className="flex items-center gap-1">
                <span className="font-sans font-bold text-xs text-stone-300">
                  {completedCount} /
                </span>
                {goalEditing ? (
                  <input
                    type="number"
                    defaultValue={readingGoal}
                    onBlur={(e) => handleSaveGoal(e.target.value)}
                    onKeyDown={(e: any) => {
                      if (e.key === 'Enter') handleSaveGoal(e.target.value);
                    }}
                    className="w-10 text-xs font-bold border border-[#212429] bg-[#0A0B0D] text-white rounded px-1 py-0.2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => setGoalEditing(true)}
                    className="font-sans font-bold text-xs text-white hover:text-amber-500 underline decoration-dotted decoration-[#6B7280]"
                    title="Click to edit annual goal"
                  >
                    {readingGoal}
                  </button>
                )}
              </div>
            </div>

            {/* Minimal Circular Goal progress percent */}
            <div className="text-[10px] font-mono font-semibold text-[#9CA3AF] bg-[#212429] rounded-full px-1.5 py-0.5 ml-1">
              {Math.min(100, Math.round((completedCount / (readingGoal || 1)) * 100))}%
            </div>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="bg-[#16191F] hover:bg-[#212429] border border-[#212429] hover:border-amber-500/30 text-white rounded-lg p-2.5 shadow-md transition-colors"
            title="Cloud Sync Settings"
          >
            <Cloud className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main core interface grid */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1 w-full">
        {/* Left side panel: optical simulated scanner & AI Companion box */}
        <section id="sidebar-controls" className="lg:col-span-4 order-2 lg:order-2 space-y-6 flex flex-col w-full">
          {/* AI Advisor Box */}
          <AIRecommendCard library={safeLibrary} onAddRecommendation={handleAddRecommendation} />

          {/* Scanner & Keyword Lookup */}
          <ScannerAndSearch library={safeLibrary} onAddBook={handleAddBook} />

          {/* Quick instructions manual */}
          <div className="bg-[#16191F]/60 border border-[#212429] p-4 rounded-xl flex gap-3 text-[#9CA3AF] text-xs leading-relaxed">
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-serif italic text-white font-medium mb-1">
                Reflections nourish recommendations
              </p>
              Your journal is offline-first. Record ratings, favorite quotes, and detailed reactions in your logs. The Gemini Oracle uses these specific journal reflections to make highly personalized read recommendations.
            </div>
          </div>
        </section>

        {/* Right side reading log lists / grid logs */}
        <section id="library-catalog" className="lg:col-span-8 order-1 lg:order-1 space-y-6 w-full">
          {/* Favorite Authors' New Releases Tracker */}
          <FavoriteAuthorReleases library={safeLibrary} onAddBook={handleAddNewRelease} />

          {/* Filtering bar and Sorting options */}
          <div className="bg-[#0F1115] border border-[#212429] rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-md">
            {/* Quick Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 text-xs font-sans font-semibold rounded-lg transition-all ${
                  activeTab === 'all'
                    ? 'bg-amber-500 text-black font-bold'
                    : 'bg-transparent text-[#9CA3AF] hover:bg-[#16191F] hover:text-white'
                }`}
              >
                All ({totalBooks})
              </button>

              <button
                onClick={() => setActiveTab('reading')}
                className={`px-3 py-1.5 text-xs font-sans font-semibold rounded-lg transition-all flex items-center gap-1 ${
                  activeTab === 'reading'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold'
                    : 'bg-transparent text-[#9CA3AF] hover:bg-[#16191F] hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Reading ({readingCount})
              </button>

              <button
                onClick={() => setActiveTab('to-read')}
                className={`px-3 py-1.5 text-xs font-sans font-semibold rounded-lg transition-all flex items-center gap-1 ${
                  activeTab === 'to-read'
                    ? 'bg-zinc-800 text-white border border-[#212429]'
                    : 'bg-transparent text-[#9CA3AF] hover:bg-[#16191F] hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> To Read ({wishlistCount})
              </button>

              <button
                onClick={() => setActiveTab('completed')}
                className={`px-3 py-1.5 text-xs font-sans font-semibold rounded-lg transition-all flex items-center gap-1 ${
                  activeTab === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold'
                    : 'bg-transparent text-[#9CA3AF] hover:bg-[#16191F] hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Done ({completedCount})
              </button>

              <button
                onClick={() => setActiveTab('favorites')}
                className={`px-3 py-1.5 text-xs font-sans font-semibold rounded-lg transition-all flex items-center gap-1 ${
                  activeTab === 'favorites'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold'
                    : 'bg-transparent text-[#9CA3AF] hover:bg-[#16191F] hover:text-white'
                }`}
              >
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-500/30" /> Favorites ({favoriteCount})
              </button>
            </div>

            {/* In-tab dynamic Text filter search & Sorting dropdown */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-44">
                <Search className="absolute left-2.5 top-2.2 w-3.5 h-3.5 text-[#6B7280]" />
                <input
                  type="text"
                  placeholder="Filter logs..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 text-xs border border-[#212429] rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans bg-[#16191F] text-white"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="text-xs bg-[#16191F] hover:bg-[#1f232b] text-[#E0E2E6] border border-[#212429] rounded-lg py-1.5 px-2.5 font-sans focus:outline-none cursor-pointer"
              >
                <option value="dateAdded">Sort: Newest</option>
                <option value="rating">Sort: Best Rating</option>
              </select>
            </div>
          </div>

          {/* Book Catalog list/grid visualization */}
          {processedBooks.length === 0 ? (
            <div className="text-center py-24 bg-[#0F1115] border border-dashed border-[#212429] rounded-xl flex flex-col items-center justify-center p-8">
              <BookMarked className="w-12 h-12 text-[#4B5563] mb-3" />
              <h3 className="font-serif font-semibold text-lg text-white tracking-tight">
                No matching journal logs
              </h3>
              <p className="text-[#6B7280] text-xs mt-1 max-w-sm font-sans">
                {searchFilter
                  ? 'We couldn’t find any books matching those keywords. Try refining your filters.'
                  : 'This tab is empty! Add a book via simulated barcode scans or query any title to populate your library.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {processedBooks.map((book) => (
                <div
                  key={book.id}
                  onClick={() => setSelectedBook(book)}
                  className="flex bg-[#16191F] rounded-xl border border-[#212429] hover:border-amber-500/50 hover:shadow-lg p-4 gap-4 transition-all duration-200 cursor-pointer group relative overflow-hidden"
                >
                  {/* Heart button indicator */}
                  {book.favorite && (
                    <div className="absolute top-3 right-3 text-rose-500 animate-pulse z-10">
                      <Heart className="w-3.5 h-3.5 fill-rose-500" />
                    </div>
                  )}

                  <div className="shrink-0">
                    <BookCover title={book.title} author={book.author} genre={book.genre} isbn={book.isbn} size="md" />
                  </div>

                  <div className="flex-1 flex flex-col justify-between overflow-hidden min-h-[160px]">
                    <div>
                      {/* Badge and Star rating rows */}
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                            book.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : book.status === 'reading'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-zinc-800 text-stone-300 border border-[#212429]'
                          }`}
                        >
                          {book.status === 'completed' ? 'Done' : book.status === 'reading' ? 'Reading' : 'To Read'}
                        </span>

                        {book.rating > 0 && (
                          <div className="flex items-center gap-0.5 text-amber-500">
                            {Array.from({ length: book.rating }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-amber-500 text-amber-500" />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Info header */}
                      <h3 className="font-serif font-bold text-white tracking-tight leading-snug mt-2 text-base truncate group-hover:text-amber-500 transition-colors">
                        <HighlightText text={book.title} highlight={searchFilter} />
                      </h3>
                      <p className="text-xs text-[#6B7280] font-sans mt-0.5 truncate">
                        by <HighlightText text={book.author} highlight={searchFilter} />
                      </p>
                    </div>

                    {/* Book reactions journal snippet preview */}
                    <div className="mt-3 text-[11px] font-serif leading-relaxed text-[#9CA3AF] italic border-l border-[#212429] pl-2 line-clamp-3">
                      {book.userNotes ? (
                        <HighlightText text={book.userNotes} highlight={searchFilter} />
                      ) : (
                        'No journal reflections written yet. Tap to record thoughts, star ratings, and quotes!'
                      )}
                    </div>

                    {/* Meta stats date block */}
                    <div className="flex items-center justify-between text-[9px] text-[#6B7280] font-mono mt-2 pt-2 border-t border-[#212429]">
                      <span>Added: {book.dateAdded}</span>
                      {Boolean(book.keyQuotes && book.keyQuotes.length > 0) && (
                        <span>💬 {book.keyQuotes?.length} Quotes</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Exquisite side sliding drawer / journal detail modal */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onSave={handleSaveBookDetails}
          onDelete={handleDeleteBook}
        />
      )}

      {/* Cloud Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#16191F] border border-[#212429] rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 text-[#6B7280] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-serif font-bold text-white mb-4 flex items-center gap-2">
              <Cloud className="w-5 h-5 text-amber-500" /> Cloud Sync
            </h2>
            <GoogleDriveSync library={safeLibrary} onImport={saveLibraryState} />
          </div>
        </div>
      )}

      {/* Editorial copyright brand footer */}
      <footer className="mt-16 border-t border-[#212429] py-8 text-center text-[#4B5563] font-mono text-[10px] tracking-[0.2em] uppercase">
        © 2026 WITH BOOK • CRAFTED WITH DEDICATION • OFFLINE FIRST JOURNALING
      </footer>

      {/* Global AI Chat Assistant Floating Drawer */}
      <ChatCorner library={safeLibrary} onAddBook={handleAddBook} />
    </div>
  );
}
