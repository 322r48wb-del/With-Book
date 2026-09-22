/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Heart, 
  Star, 
  Search, 
  SlidersHorizontal, 
  BarChart3, 
  Trophy, 
  BookMarked,
  Info,
  Settings,
  X,
  Cloud,
  LayoutGrid,
  Compass,
  Sparkles,
  Share2,
  Download
} from 'lucide-react';
import { Book, ReadingStatus, AIRecommendation, BookFeelings } from './types';
import BookCover from './components/BookCover';
import ScannerAndSearch from './components/ScannerAndSearch';
import AIRecommendCard from './components/AIRecommendCard';
import BookDetailModal from './components/BookDetailModal';
import GoogleDriveSync from './components/GoogleDriveSync';
import FavoriteAuthorReleases from './components/FavoriteAuthorReleases';
import { ChatCorner } from './components/ChatCorner';
import HighlightText from './components/HighlightText';
import BookPositioningMap from './components/BookPositioningMap';
import ShareLogsModal from './components/ShareLogsModal';
import { getBookFeelings, getFeelingQuadrant } from './utils/feelingUtils';

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
    ],
    feelings: {
      happiness: -40,
      impressed: 85,
      tags: ['Mind-bending', 'Deeply Impressed', 'Epic']
    }
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
    ],
    feelings: {
      happiness: -55,
      impressed: 70,
      tags: ['Thrilling', 'Deeply Impressed']
    }
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
    ],
    feelings: {
      happiness: 75,
      impressed: 80,
      tags: ['Happy', 'Inspiring', 'Deeply Impressed']
    }
  },
  {
    id: 'seed-4',
    title: 'Before the Coffee Gets Cold',
    author: 'Toshikazu Kawaguchi',
    genre: 'Fiction',
    cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1594918731i/44421460.jpg',
    isbn: '9781335430991',
    description: 'In a small back alley in Tokyo, there is a cafe which has been serving carefully brewed coffee for more than one hundred years. But this coffee shop offers its customers a unique experience: the chance to travel back in time.',
    userNotes: 'A gentle, nostalgic, and heartwarming read. It was so relaxing to read this on a quiet rainy afternoon. The cafe rules give it a bittersweet charm.',
    rating: 4,
    status: 'completed',
    dateAdded: '2026-07-12',
    dateStarted: '2026-07-12',
    dateCompleted: '2026-07-15',
    favorite: true,
    keyQuotes: [
      'At the end of the day, whether one is in the past or the present, nothing changes reality.'
    ],
    feelings: {
      happiness: 60,
      impressed: -15,
      tags: ['Cozy', 'Peaceful', 'Happy']
    }
  },
  {
    id: 'seed-5',
    title: 'The Guest List',
    author: 'Lucy Foley',
    genre: 'Mystery',
    cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1572973166i/51933429.jpg',
    isbn: '9780062868930',
    description: 'A wedding celebration turns deadly in this deliciously wicked and atmospheric thriller reminiscent of Agatha Christie from the New York Times bestselling author of The Hunting Party.',
    userNotes: 'A stormy island mystery with dark secrets and fast pacing. Perfect beach thriller read.',
    rating: 3,
    status: 'to-read',
    dateAdded: '2026-07-18',
    favorite: false,
    keyQuotes: [],
    feelings: {
      happiness: -70,
      impressed: -20,
      tags: ['Thrilling', 'Moody']
    }
  }
];

export default function App() {
  const [library, setLibrary] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | ReadingStatus | 'favorites'>('all');
  const [catalogView, setCatalogView] = useState<'grid' | 'positioning-map'>('grid');
  const [sortBy, setSortBy] = useState<'dateAdded' | 'rating'>('dateAdded');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Custom reading target goals
  const [readingGoal, setReadingGoal] = useState<number>(12);
  const [goalEditing, setGoalEditing] = useState(false);

  // Share modal state
  const [isShareLogsOpen, setIsShareLogsOpen] = useState(false);
  const [shareInitialBook, setShareInitialBook] = useState<Book | null>(null);

  // Shared logs view state (when opened via share link ?share=... or ?shared_data=...)
  const [sharedViewData, setSharedViewData] = useState<{
    readerName?: string;
    books: Book[];
    readingGoal?: number;
    shareNote?: string;
  } | null>(null);
  const [sharedImportToast, setSharedImportToast] = useState<string | null>(null);

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

    // Check if user opened app via a share link
    try {
      const params = new URLSearchParams(window.location.search);
      const shareId = params.get('share');
      const sharedDataRaw = params.get('shared_data');

      if (shareId) {
        fetch(`/api/share/${shareId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.record && Array.isArray(data.record.books) && data.record.books.length > 0) {
              setSharedViewData({
                readerName: data.record.readerName,
                books: data.record.books,
                readingGoal: data.record.readingGoal,
                shareNote: data.record.shareNote,
              });
            }
          })
          .catch((err) => console.warn('Could not load shared logs:', err));
      } else if (sharedDataRaw) {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(sharedDataRaw)))));
        if (decoded && Array.isArray(decoded.books) && decoded.books.length > 0) {
          setSharedViewData({
            readerName: decoded.readerName,
            books: decoded.books,
            readingGoal: decoded.readingGoal,
            shareNote: decoded.shareNote,
          });
        }
      }
    } catch (err) {
      console.warn('Error reading share parameters from URL:', err);
    }
  }, []);

  // Import shared books into user's own persistent library
  const handleImportSharedBooks = () => {
    if (!sharedViewData || !sharedViewData.books.length) return;
    const existingTitles = new Set(library.map((b) => b.title.toLowerCase().trim()));
    const newBooks = sharedViewData.books.filter((b) => !existingTitles.has(b.title.toLowerCase().trim()));

    if (newBooks.length === 0) {
      alert('All books in this shared log already exist in your library!');
      return;
    }

    const updated = [...newBooks, ...library];
    saveLibraryState(updated);
    setSharedImportToast(`Imported ${newBooks.length} book${newBooks.length === 1 ? '' : 's'} into your personal library!`);
    setTimeout(() => setSharedImportToast(null), 5000);
    handleExitSharedView();
  };

  const handleExitSharedView = () => {
    setSharedViewData(null);
    window.history.replaceState({}, '', window.location.pathname);
  };

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

    const updated = [newBook, ...library];
    saveLibraryState(updated);
    
    // Automatically trigger notes opening to let them review
    setSelectedBook(newBook);
  };

  // Add highly targeted recommended books
  const handleAddRecommendation = (rec: AIRecommendation) => {
    // Check if recommendation is already added to prevent duplicates
    if (library.some(b => b.title.toLowerCase() === rec.title.toLowerCase())) {
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
      userNotes: `Discovered via Gemini AI Suggestion: "Perfect for me because ${rec.reason.slice(0, 100)}..."`,
      rating: 0,
      status: 'to-read',
      favorite: false,
      dateAdded: new Date().toISOString().split('T')[0],
      keyQuotes: []
    };

    const updated = [newBook, ...library];
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
    const updated = [newBook, ...library];
    saveLibraryState(updated);
    setSelectedBook(newBook);
  };

  // Save specific book updates inside the modal
  const handleSaveBookDetails = (updatedBook: Book) => {
    const updated = library.map((b) => b.id === updatedBook.id ? updatedBook : b);
    saveLibraryState(updated);
  };

  // Delete book from logs
  const handleDeleteBook = (id: string) => {
    const updated = library.filter((b) => b.id !== id);
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

  // Active library to display (either user's own, or shared logs being viewed)
  const currentLibrary = sharedViewData ? sharedViewData.books : library;
  const effectiveGoal = sharedViewData?.readingGoal || readingGoal;

  // Calculate statistics
  const totalBooks = currentLibrary.length;
  const readingCount = currentLibrary.filter((b) => b.status === 'reading').length;
  const completedCount = currentLibrary.filter((b) => b.status === 'completed').length;
  const wishlistCount = currentLibrary.filter((b) => b.status === 'to-read').length;
  const favoriteCount = currentLibrary.filter((b) => b.favorite).length;

  // Filter & search criteria
  const processedBooks = currentLibrary
    .filter((book) => {
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
      const matchQuotes = book.keyQuotes?.some((q) => q.toLowerCase().includes(term));
      const matchDesc = book.description?.toLowerCase().includes(term);
      return (
        book.title.toLowerCase().includes(term) ||
        book.author.toLowerCase().includes(term) ||
        book.genre.toLowerCase().includes(term) ||
        book.userNotes.toLowerCase().includes(term) ||
        Boolean(matchQuotes) ||
        Boolean(matchDesc)
      );
    })
    .sort((a, b) => {
      // Sorting rule
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      // default: latest dateAdded first
      return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
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
              {Math.min(100, Math.round((completedCount / (effectiveGoal || 1)) * 100))}%
            </div>
          </div>

          <button
            onClick={() => {
              setShareInitialBook(null);
              setIsShareLogsOpen(true);
            }}
            className="bg-amber-500 hover:bg-amber-400 text-black font-sans font-bold text-xs rounded-lg px-3.5 py-2.5 shadow-md transition-all flex items-center gap-1.5 shrink-0"
            title="Share your reading logs with others"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Logs</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="bg-[#16191F] hover:bg-[#212429] border border-[#212429] hover:border-amber-500/30 text-white rounded-lg p-2.5 shadow-md transition-colors"
            title="Cloud Sync Settings"
          >
            <Cloud className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Import Success Notification */}
      {sharedImportToast && (
        <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-sans shadow-md animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{sharedImportToast}</span>
          </div>
          <button onClick={() => setSharedImportToast(null)} className="text-stone-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Shared Logs Viewing Banner */}
      {sharedViewData && (
        <div className="mb-6 bg-gradient-to-r from-amber-500/15 via-[#16191F] to-[#16191F] border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-black rounded-lg shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                  Shared Reading Journal
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                  {sharedViewData.books.length} Books Logged
                </span>
              </div>
              <p className="text-sm font-serif text-white mt-0.5">
                Viewing reading logs shared by <span className="text-amber-400 font-bold">{sharedViewData.readerName || 'a fellow reader'}</span>
                {sharedViewData.shareNote ? ` — "${sharedViewData.shareNote}"` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={handleImportSharedBooks}
              className="px-3.5 py-2 text-xs font-sans font-bold bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Import into My Shelves</span>
            </button>
            <button
              onClick={handleExitSharedView}
              className="px-3 py-2 text-xs font-sans text-[#9CA3AF] hover:text-white bg-[#212429] hover:bg-[#2A2E35] rounded-lg transition-colors"
            >
              Return to My Logs
            </button>
          </div>
        </div>
      )}

      {/* Main core interface grid */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1 w-full">
        
        {/* Left side panel: optical simulated scanner & AI Companion box */}
        <section id="sidebar-controls" className="lg:col-span-4 order-2 lg:order-2 space-y-6 flex flex-col w-full">
          {/* AI Advisor Box */}
          <AIRecommendCard library={library} onAddRecommendation={handleAddRecommendation} />

          {/* Scanner & Keyword Lookup */}
          <ScannerAndSearch library={library} onAddBook={handleAddBook} />

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
          
          {/* View Mode Bar: Shelf / Grid vs Emotional Positioning Map */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-[#0F1115] border border-[#212429] rounded-xl p-3.5 gap-3 shadow-md">
            <div>
              <h2 className="font-serif font-bold text-white text-base flex items-center gap-2">
                <span>Personal Library Catalog</span>
                <span className="text-xs font-mono font-normal text-[#9CA3AF]">
                  ({currentLibrary.length} books logged)
                </span>
              </h2>
              <p className="text-xs text-[#9CA3AF] font-sans">
                Browse through your library shelves or explore them on the 2D Emotional Positioning Map.
              </p>
            </div>

            <div className="flex items-center bg-[#16191F] border border-[#212429] rounded-xl p-1 text-xs self-start sm:self-auto shadow-inner">
              <button
                onClick={() => setCatalogView('grid')}
                className={`px-3 py-1.5 rounded-lg font-sans font-semibold transition-all flex items-center gap-1.5 ${catalogView === 'grid' ? 'bg-amber-500 text-black font-bold shadow-sm' : 'text-[#9CA3AF] hover:text-white'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Shelf Grid</span>
              </button>
              <button
                onClick={() => setCatalogView('positioning-map')}
                className={`px-3 py-1.5 rounded-lg font-sans font-semibold transition-all flex items-center gap-1.5 ${catalogView === 'positioning-map' ? 'bg-amber-500 text-black font-bold shadow-sm' : 'text-[#9CA3AF] hover:text-white'}`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Positioning Map</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              </button>
              <button
                onClick={() => {
                  setShareInitialBook(null);
                  setIsShareLogsOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg font-sans font-semibold text-[#9CA3AF] hover:text-white hover:bg-[#212429] transition-all flex items-center gap-1.5"
                title="Share your reading logs"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>

          {/* Conditional View: Positioning Map vs Traditional Grid */}
          {catalogView === 'positioning-map' ? (
            <BookPositioningMap
              books={currentLibrary}
              onSelectBook={(book) => setSelectedBook(book)}
              onUpdateBookFeelings={(bookId, feelings) => {
                const updated = library.map((b) => b.id === bookId ? { ...b, feelings } : b);
                saveLibraryState(updated);
              }}
              searchFilter={searchFilter}
            />
          ) : (
            <>
              {/* Favorite Authors' New Releases Tracker */}
              <FavoriteAuthorReleases 
                library={library} 
                onAddBook={handleAddNewRelease} 
              />

          {/* Filtering bar and Sorting options */}
          <div className="bg-[#0F1115] border border-[#212429] rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-md">
            
            {/* Quick Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 text-xs font-sans font-semibold rounded-lg transition-all
                  ${activeTab === 'all' 
                    ? 'bg-amber-500 text-black font-bold' 
                    : 'bg-transparent text-[#9CA3AF] hover:bg-[#16191F] hover:text-white'
                  }`}
              >
                All ({totalBooks})
              </button>
              <button
                onClick={() => setActiveTab('reading')}
                className={`px-3 py-1.5 text-xs font-sans font-semibold rounded-lg transition-all flex items-center gap-1
                  ${activeTab === 'reading' 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold' 
                    : 'bg-transparent text-[#9CA3AF] hover:bg-[#16191F] hover:text-white'
                  }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Reading ({readingCount})
              </button>
              <button
                onClick={() => setActiveTab('to-read')}
                className={`px-3 py-1.5 text-xs font-sans font-semibold rounded-lg transition-all flex items-center gap-1
                  ${activeTab === 'to-read' 
                    ? 'bg-zinc-800 text-white border border-[#212429]' 
                    : 'bg-transparent text-[#9CA3AF] hover:bg-[#16191F] hover:text-white'
                  }`}
              >
                <Clock className="w-3.5 h-3.5" />
                To Read ({wishlistCount})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-3 py-1.5 text-xs font-sans font-semibold rounded-lg transition-all flex items-center gap-1
                  ${activeTab === 'completed' 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold' 
                    : 'bg-transparent text-[#9CA3AF] hover:bg-[#16191F] hover:text-white'
                  }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Done ({completedCount})
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`px-3 py-1.5 text-xs font-sans font-semibold rounded-lg transition-all flex items-center gap-1
                  ${activeTab === 'favorites' 
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold' 
                    : 'bg-transparent text-[#9CA3AF] hover:bg-[#16191F] hover:text-white'
                  }`}
              >
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-500/30" />
                Favorites ({favoriteCount})
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
                  : 'This tab is empty! Add a book via simulated barcode scans or query any title to populate your library.'
                }
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
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider
                          ${book.status === 'completed' 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : book.status === 'reading'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-zinc-800 text-stone-300 border border-[#212429]'
                          }`}>
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

                      {/* Feelings positioning badge & Hashtags */}
                      {(() => {
                        const feelings = getBookFeelings(book);
                        const quad = getFeelingQuadrant(feelings.happiness, feelings.impressed);
                        return (
                          <div className="mt-1.5 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold ${quad.badgeColor}`}>
                                {quad.title}
                              </span>
                              <span className="text-[9px] font-mono text-[#9CA3AF]">
                                {feelings.happiness >= 0 ? `+${feelings.happiness}` : feelings.happiness}H • {feelings.impressed >= 0 ? `+${feelings.impressed}` : feelings.impressed}I
                              </span>
                            </div>

                            {feelings.hashtags && feelings.hashtags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {feelings.hashtags.slice(0, 3).map((ht, idx) => (
                                  <span 
                                    key={idx} 
                                    className="text-[9px] font-mono text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded-full"
                                  >
                                    {ht}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
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
                      <div className="flex items-center gap-2">
                        <span>Added: {book.dateAdded}</span>
                        {book.keyQuotes && book.keyQuotes.length > 0 && (
                          <span>💬 {book.keyQuotes.length} Quotes</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareInitialBook(book);
                          setIsShareLogsOpen(true);
                        }}
                        className="p-1 text-[#6B7280] hover:text-amber-400 hover:bg-[#212429] rounded transition-colors flex items-center gap-1 font-sans text-[10px]"
                        title="Share this book log"
                      >
                        <Share2 className="w-3 h-3" />
                        <span className="hidden sm:inline">Share</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </>
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

      {/* Share Reading Logs Modal */}
      {isShareLogsOpen && (
        <ShareLogsModal
          library={library}
          readingGoal={readingGoal}
          initialBook={shareInitialBook}
          onClose={() => {
            setIsShareLogsOpen(false);
            setShareInitialBook(null);
          }}
        />
      )}

      {/* Editorial copyright brand footer */}
      <footer className="mt-16 border-t border-[#212429] py-8 text-center text-[#4B5563] font-mono text-[10px] tracking-[0.2em] uppercase">
        © 2026 WITH BOOK • CRAFTED WITH DEDICATION • OFFLINE FIRST JOURNALING
      </footer>

      {/* Cloud Sync Settings Sidebar Drawer */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSettingsOpen(false)}
          />
          <div className="relative w-full max-w-md bg-[#0A0B0D] h-full shadow-2xl border-l border-[#212429] flex flex-col animate-slide-in-right overflow-y-auto">
            <div className="p-4 border-b border-[#212429] flex items-center justify-between sticky top-0 bg-[#0A0B0D]/90 backdrop-blur z-10">
              <h2 className="text-white font-serif font-bold text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-500" />
                Settings & Cloud Sync
              </h2>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 bg-[#16191F] hover:bg-[#212429] text-[#9CA3AF] hover:text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-6">
              <GoogleDriveSync 
                library={library} 
                readingGoal={readingGoal} 
                onRestore={(restoredLib, restoredGoal) => {
                  setLibrary(restoredLib);
                  setReadingGoal(restoredGoal);
                  localStorage.setItem('withbook_library', JSON.stringify(restoredLib));
                  localStorage.setItem('withbook_reading_goal', restoredGoal.toString());
                }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Persistent floating AI chat corner */}
      <ChatCorner library={library} />

    </div>
  );
}
