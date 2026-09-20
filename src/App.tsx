import React, { useState, useEffect } from 'react';
import { Book, Position2D } from './types';
import {
  BookOpen,
  Plus,
  LayoutGrid,
  MapPin,
  Sparkles,
  Search,
  BookMarked,
  Layers,
  Award,
  RefreshCw,
  Share2,
  Download,
  X,
  CheckCircle2
} from 'lucide-react';
import { ScannerAndSearch } from './components/ScannerAndSearch';
import { BookPositioningMap } from './components/BookPositioningMap';
import { AIRecommendCard } from './components/AIRecommendCard';
import { BookDetailModal } from './components/BookDetailModal';
import { ShareLogsModal } from './components/ShareLogsModal';
import { ChatCorner } from './components/ChatCorner';
import { FavoriteAuthorReleases } from './components/FavoriteAuthorReleases';
import { GoogleDriveSync } from './components/GoogleDriveSync';
import { BookCover } from './components/BookCover';

const INITIAL_BOOKS: Book[] = [
  {
    id: '1',
    title: '嫌われる勇気',
    author: '岸見一郎・古賀史健',
    category: '自己啓発',
    rating: 5,
    memo: 'アドラー心理学の入門書。対人関係の悩みを根本から見直すきっかけになった。',
    quote: '課題の分離ができるようになると、人生は劇的にシンプルになる。',
    addedAt: '2024-01-15',
    position: { x: 80, y: 85 },
    quadrant: '励まされる × 思考を深める',
  },
  {
    id: '2',
    title: 'コンビニ人間',
    author: '村田沙耶香',
    category: '小説',
    rating: 4,
    memo: '「普通」とは何かを考えさせられる作品。独特な世界観に引き込まれた。',
    quote: '私は世界の部品になりたかった。',
    addedAt: '2024-02-01',
    position: { x: 30, y: 75 },
    quadrant: '静かに浸る × 思考を深める',
  },
  {
    id: '3',
    title: '心に折り合いをつけて うまいことやる習慣',
    author: '中村恒子',
    category: 'エッセイ',
    rating: 5,
    memo: '90歳の精神科医が語る人生の知恵。肩の力がすっと抜ける温かい一冊。',
    quote: '人間関係は、付かず離れず、ほどほどの距離感が一番です。',
    addedAt: '2024-02-20',
    position: { x: 85, y: 25 },
    quadrant: '励まされる × 心をほぐす',
  },
];

export function App() {
  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem('with_book_library');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved books', e);
      }
    }
    return INITIAL_BOOKS;
  });

  const [activeTab, setActiveTab] = useState<'shelf' | 'map'>('shelf');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareBookId, setShareBookId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Shared Link Import Banner state
  const [sharedImportData, setSharedImportData] = useState<{
    sender: string;
    note: string;
    books: Book[];
  } | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  useEffect(() => {
    localStorage.setItem('with_book_library', JSON.stringify(books));
  }, [books]);

  // Handle Share Link URL search params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareData = params.get('share');
    if (shareData) {
      try {
        const decoded = decodeURIComponent(atob(shareData));
        const parsed = JSON.parse(decoded);
        if (parsed && parsed.books && Array.isArray(parsed.books)) {
          setSharedImportData({
            sender: parsed.sender || '読書仲間',
            note: parsed.note || '',
            books: parsed.books,
          });
        }
      } catch (e) {
        console.error('Failed to decode share parameter', e);
      }
    }
  }, []);

  const handleAddBook = (newBook: Omit<Book, 'id' | 'addedAt'>) => {
    const book: Book = {
      ...newBook,
      id: Date.now().toString(),
      addedAt: new Date().toISOString().split('T')[0],
      position: newBook.position || { x: 50, y: 50 },
    };
    setBooks((prev) => [book, ...prev]);
    setIsScannerOpen(false);
  };

  const handleUpdateBook = (updatedBook: Book) => {
    setBooks((prev) => prev.map((b) => (b.id === updatedBook.id ? updatedBook : b)));
    setSelectedBook(updatedBook);
  };

  const handleDeleteBook = (id: string) => {
    if (window.confirm('この読書ログを削除しますか？')) {
      setBooks((prev) => prev.filter((b) => b.id !== id));
      setSelectedBook(null);
    }
  };

  const handleUpdatePosition = (id: string, position: Position2D, quadrant?: string) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, position, quadrant: quadrant || b.quadrant } : b))
    );
  };

  const handleImportSharedBooks = () => {
    if (!sharedImportData) return;
    
    // Filter out books already exists by title and author
    const existingKeys = new Set(books.map((b) => `${b.title}-${b.author}`));
    const newBooksToAdd = sharedImportData.books
      .filter((b) => !existingKeys.has(`${b.title}-${b.author}`))
      .map((b) => ({
        ...b,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
        addedAt: new Date().toISOString().split('T')[0],
      }));

    if (newBooksToAdd.length > 0) {
      setBooks((prev) => [...newBooksToAdd, ...prev]);
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 4000);
    } else {
      alert('すべての本がすでに本棚に登録されています！');
    }
  };

  const categories = ['all', ...Array.from(new Set(books.map((b) => b.category).filter(Boolean)))];

  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.memo && b.memo.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || b.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24">
      {/* Top Banner for Shared Logs */}
      {sharedImportData && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white px-4 py-3 shadow-md relative">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-200 shrink-0 animate-pulse" />
              <div>
                <span className="font-bold">{sharedImportData.sender}</span> さんから読書ログ（
                {sharedImportData.books.length}冊）が届いています！
                {sharedImportData.note && (
                  <span className="ml-2 text-amber-100 italic">「{sharedImportData.note}」</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleImportSharedBooks}
                className="px-3.5 py-1.5 bg-white text-amber-700 font-bold rounded-lg text-xs shadow hover:bg-amber-50 transition-colors flex items-center gap-1.5"
              >
                {importSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    本棚に追加しました！
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    自分の本棚に取り込む
                  </>
                )}
              </button>
              <button
                onClick={() => setSharedImportData(null)}
                className="p-1 hover:bg-white/20 rounded-lg text-amber-100 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-md shadow-amber-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-lg leading-none">With Book</h1>
              <p className="text-xs text-slate-400 mt-0.5">読書ログ・感情マッピング</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShareBookId(null);
                setIsShareModalOpen(true);
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold rounded-xl text-xs transition-colors border border-amber-200/60"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>ログを共有</span>
            </button>

            <GoogleDriveSync books={books} onSyncToApp={(syncedBooks) => setBooks(syncedBooks)} />

            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>読書ログを追加</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-8">
        
        {/* Top Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <AIRecommendCard books={books} />
          </div>
          <div>
            <FavoriteAuthorReleases books={books} />
          </div>
        </div>

        {/* View Switcher & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          
          {/* Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('shelf')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'shelf'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>本棚グリッド ({books.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'map'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>感情ポジショニングマップ</span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="タイトル・著者名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? 'すべてのカテゴリ' : c}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setShareBookId(null);
                setIsShareModalOpen(true);
              }}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors sm:hidden"
              title="ログを共有"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Main View Content */}
        {activeTab === 'shelf' ? (
          <div>
            {filteredBooks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <BookMarked className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-slate-500 text-sm font-medium">該当する読書ログが見つかりません</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterCategory('all');
                  }}
                  className="text-xs text-amber-600 font-semibold hover:underline"
                >
                  検索条件をリセット
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredBooks.map((book) => (
                  <div
                    key={book.id}
                    onClick={() => setSelectedBook(book)}
                    className="group bg-white rounded-xl border border-slate-200/80 p-3 shadow-sm hover:shadow-md hover:border-amber-400 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden"
                  >
                    <div>
                      <div className="aspect-[3/4] w-full mb-3 rounded-lg overflow-hidden shadow-sm">
                        <BookCover title={book.title} author={book.author} coverUrl={book.coverUrl} />
                      </div>
                      <h3 className="font-bold text-slate-800 text-xs line-clamp-2 leading-snug group-hover:text-amber-600 transition-colors">
                        {book.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{book.author}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-semibold text-amber-500">★ {book.rating}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareBookId(book.id);
                          setIsShareModalOpen(true);
                        }}
                        className="p-1 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                        title="この本を共有"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <BookPositioningMap
            books={books}
            onSelectBook={(book) => setSelectedBook(book)}
            onUpdatePosition={handleUpdatePosition}
          />
        )}
      </main>

      {/* Floating Interactive Chat Corner */}
      <ChatCorner books={books} />

      {/* Modals */}
      <ScannerAndSearch
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onAddBook={handleAddBook}
      />

      <BookDetailModal
        book={selectedBook}
        isOpen={!!selectedBook}
        onClose={() => setSelectedBook(null)}
        onUpdate={handleUpdateBook}
        onDelete={handleDeleteBook}
        onOpenShare={(bookId) => {
          setShareBookId(bookId);
          setIsShareModalOpen(true);
        }}
      />

      <ShareLogsModal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setShareBookId(null);
        }}
        books={books}
        selectedBookId={shareBookId}
      />
    </div>
  );
}
