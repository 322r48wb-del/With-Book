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
import BookPositioningMap from './components/BookPositioningMap';
import ShareLogsModal from './components/ShareLogsModal';

const INITIAL_BOOKS: Book[] = [
  {
    id: '1',
    title: 'コンビニ人間',
    author: '村田沙耶香',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
    status: 'read',
    userNotes: '普通とは何かを考えさせられる作品。自分らしく生きることの意味。',
    rating: 5,
    favorite: true,
    dateAdded: '2025-01-15',
    isbn: '9784167911300',
    keyQuotes: ['「普通」という異国に生きているような感覚。'],
    feelings: {
      happiness: 20,
      impression: 80,
      hashtags: ['#シュール', '#社会派', '#考えさせられる', '#独特な世界観'],
      aiSummary: '日常の「普通」に対する疑問を突きつける、深く余韻の残る作品。'
    }
  },
  {
    id: '2',
    title: 'プロジェクト・ヘイル・メアリー',
    author: 'アンディ・ウィア',
    coverUrl: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400&q=80',
    status: 'reading',
    userNotes: 'SFの傑作。ロッキーとの絆に胸が熱くなる！',
    rating: 5,
    favorite: true,
    dateAdded: '2025-02-01',
    isbn: '9784152100801',
    keyQuotes: ['「アマチ、アマチ、アマチ！」'],
    feelings: {
      happiness: 90,
      impression: 95,
      hashtags: ['#感動SF', '#最高の相棒', '#胸熱', '#一気読み'],
      aiSummary: '科学への愛と種族を超えた友情に心が奮い立つ極上のエンターテインメント。'
    }
  },
  {
    id: '3',
    title: '成瀬は天下を取りに行く',
    author: '宮島未奈',
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
    status: 'to-read',
    userNotes: '気になっていた本。',
    rating: 0,
    favorite: false,
    dateAdded: '2025-02-10',
    isbn: '9784103549512',
    feelings: {
      happiness: 85,
      impression: 60,
      hashtags: ['#青春', '#爽快', '#主人公が魅力的'],
      aiSummary: '破天荒な主人公の生き様が前向きな元気をくれる青春小説。'
    }
  }
];

export default function App() {
  const [library, setLibrary] = useState<Book[]>(() => {
    const saved = localStorage.getItem('withbook_library');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse library', e);
      }
    }
    return INITIAL_BOOKS;
  });

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | ReadingStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [isDriveOpen, setIsDriveOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTargetBook, setShareTargetBook] = useState<Book | undefined>(undefined);

  // Check URL parameters for shared content
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get('share');
    if (sharedData) {
      try {
        const decoded = JSON.parse(atob(decodeURIComponent(sharedData)));
        if (decoded && (decoded.books || decoded.singleBook)) {
          // Open share modal with shared content
          setIsShareModalOpen(true);
        }
      } catch (e) {
        console.error('Failed to parse shared URL parameters', e);
      }
    }
  }, []);

  // Save changes helper
  const saveLibraryState = (newLib: Book[]) => {
    setLibrary(newLib);
    localStorage.setItem('withbook_library', JSON.stringify(newLib));
  };

  // Add Book action (triggered from scanner or manual search list)
  const handleAddBook = (
    bookMeta: Omit<
      Book,
      'id' | 'dateAdded' | 'userNotes' | 'rating' | 'status' | 'favorite'
    >
  ) => {
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
    if (library.some((b) => b.title.toLowerCase() === rec.title.toLowerCase())) {
      alert(`"${rec.title}" はすでにライブラリに含まれています！`);
      return;
    }

    const newBook: Book = {
      id: `rec-${Date.now()}`,
      title: rec.title,
      author: rec.author,
      coverUrl:
        'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80',
      status: 'to-read',
      userNotes: `【AIのおすすめ理由】\n${rec.reason}`,
      rating: 0,
      favorite: false,
      dateAdded: new Date().toISOString().split('T')[0],
      keyQuotes: []
    };

    const updated = [newBook, ...library];
    saveLibraryState(updated);
    setSelectedBook(newBook);
  };

  // Update existing book
  const handleUpdateBook = (updatedBook: Book) => {
    const updated = library.map((b) => (b.id === updatedBook.id ? updatedBook : b));
    saveLibraryState(updated);
    setSelectedBook(updatedBook);
  };

  // Update book feeling coordinates from map drag/edit
  const handleUpdateFeelings = (
    bookId: string,
    feelings: BookFeelings
  ) => {
    const updated = library.map((b) =>
      b.id === bookId ? { ...b, feelings } : b
    );
    saveLibraryState(updated);
    if (selectedBook && selectedBook.id === bookId) {
      setSelectedBook({ ...selectedBook, feelings });
    }
  };

  // Delete book from catalog
  const handleDeleteBook = (id: string) => {
    if (confirm('この本を読書ログから削除してもよろしいですか？')) {
      const updated = library.filter((b) => b.id !== id);
      saveLibraryState(updated);
      setSelectedBook(null);
    }
  };

  // Import shared books
  const handleImportBooks = (importedBooks: Book[]) => {
    let addedCount = 0;
    let updatedLib = [...library];

    importedBooks.forEach((newB) => {
      const exists = updatedLib.some(
        (b) =>
          b.title.toLowerCase() === newB.title.toLowerCase() &&
          b.author.toLowerCase() === newB.author.toLowerCase()
      );
      if (!exists) {
        updatedLib.unshift({
          ...newB,
          id: `imported-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          dateAdded: new Date().toISOString().split('T')[0]
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      saveLibraryState(updatedLib);
      alert(`${addedCount} 冊の本を自分の本棚に追加しました！`);
    } else {
      alert('追加された本はすでに本棚に存在しています。');
    }
  };

  // Open share modal for specific book or full library
  const handleOpenShare = (book?: Book) => {
    setShareTargetBook(book);
    setIsShareModalOpen(true);
  };

  // Filtered books for grid catalog
  const filteredBooks = library.filter((book) => {
    const matchesTab = activeTab === 'all' || book.status === activeTab;
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.userNotes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (book.feelings?.hashtags &&
        book.feelings.hashtags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        ));
    return matchesTab && matchesSearch;
  });

  // Calculate statistics
  const stats = {
    total: library.length,
    read: library.filter((b) => b.status === 'read').length,
    reading: library.filter((b) => b.status === 'reading').length,
    toRead: library.filter((b) => b.status === 'to-read').length,
    favorites: library.filter((b) => b.favorite).length
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500/30 selection:text-amber-200">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-amber-500 to-orange-400 p-2.5 rounded-xl shadow-md shadow-amber-500/20">
            <BookOpen className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-100 tracking-tight flex items-center gap-2">
              With Book
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                AI Powered
              </span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              読書体験を深める情緒マップ＆AIパートナー
            </p>
          </div>
        </div>

        {/* Dashboard Actions & Stats Pills */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="hidden md:flex items-center space-x-3 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <div className="flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>読了 {stats.read}</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>読書中 {stats.reading}</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center space-x-1">
              <BookMarked className="w-3.5 h-3.5 text-sky-400" />
              <span>積読 {stats.toRead}</span>
            </div>
          </div>

          <button
            onClick={() => handleOpenShare()}
            className="flex items-center space-x-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-medium transition shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ログを共有</span>
          </button>

          <button
            onClick={() => setIsDriveOpen(!isDriveOpen)}
            className={`p-2 rounded-xl border text-xs font-medium transition flex items-center space-x-2 ${
              isDriveOpen
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
            title="クラウド同期＆バックアップ設定"
          >
            <Cloud className="w-4 h-4" />
            <span className="hidden lg:inline">クラウド設定</span>
          </button>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Column */}
        <main className="lg:col-span-8 space-y-6">
          {/* Top Control Bar: View Switcher & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-3 rounded-2xl">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  viewMode === 'grid'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>本棚グリッド</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  viewMode === 'map'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>感情ポジショニングマップ</span>
              </button>
            </div>

            {/* Status Filter Tabs (Grid mode only) */}
            {viewMode === 'grid' && (
              <div className="flex items-center overflow-x-auto no-scrollbar space-x-1 text-xs">
                {(['all', 'read', 'reading', 'to-read'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                      activeTab === tab
                        ? 'bg-slate-800 text-amber-400 border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    {tab === 'all' && `すべて (${stats.total})`}
                    {tab === 'read' && `読了 (${stats.read})`}
                    {tab === 'reading' && `読書中 (${stats.reading})`}
                    {tab === 'to-read' && `積読 (${stats.toRead})`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Input Filter */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="タイトル、著者、メモ、ハッシュタグで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View Content: Grid vs Map */}
          {viewMode === 'map' ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4">
              <BookPositioningMap
                books={library}
                onSelectBook={(book) => setSelectedBook(book)}
                onUpdateFeelings={handleUpdateFeelings}
              />
            </div>
          ) : (
            /* Books Grid View */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredBooks.length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-500 bg-slate-900/30 border border-slate-800/50 rounded-2xl">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">条件に該当する本が見つかりませんでした</p>
                  <p className="text-xs mt-1 text-slate-600">
                    検索ワードを変更するか、新しい本をスキャナーから登録してください。
                  </p>
                </div>
              ) : (
                filteredBooks.map((book) => (
                  <div
                    key={book.id}
                    onClick={() => setSelectedBook(book)}
                    className="group relative bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 hover:border-slate-700 transition duration-200 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:shadow-amber-500/5"
                  >
                    <div>
                      {/* Cover Thumbnail */}
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 bg-slate-950 border border-slate-800 shadow-md">
                        <BookCover
                          url={book.coverUrl}
                          title={book.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        {book.favorite && (
                          <div className="absolute top-2 right-2 bg-amber-500/90 text-slate-950 p-1 rounded-full shadow-md">
                            <Star className="w-3 h-3 fill-slate-950" />
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-md shadow-sm ${
                              book.status === 'read'
                                ? 'bg-emerald-500/80 text-white'
                                : book.status === 'reading'
                                ? 'bg-amber-500/80 text-slate-950'
                                : 'bg-slate-800/80 text-slate-300'
                            }`}
                          >
                            {book.status === 'read' && '読了'}
                            {book.status === 'reading' && '読書中'}
                            {book.status === 'to-read' && '積読'}
                          </span>
                        </div>
                      </div>

                      {/* Title & Author */}
                      <h3 className="font-semibold text-sm text-slate-100 line-clamp-1 group-hover:text-amber-300 transition">
                        {book.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {book.author}
                      </p>

                      {/* Feeling Hashtags Preview */}
                      {book.feelings?.hashtags && book.feelings.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {book.feelings.hashtags.slice(0, 2).map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400/90 border border-amber-500/20"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-slate-300 font-medium">
                          {book.rating > 0 ? book.rating : '-'}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenShare(book);
                        }}
                        className="p-1 hover:text-amber-400 transition"
                        title="この本を共有"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>

        {/* Sidebar Column: Scanner & AI Features */}
        <aside className="lg:col-span-4 space-y-6">
          {/* ISBN / Barcode Scanner & Search */}
          <ScannerAndSearch onAddBook={handleAddBook} />

          {/* AI Book Advisor Recommendations */}
          <AIRecommendCard
            library={library}
            onAddRecommendation={handleAddRecommendation}
          />

          {/* New Releases from Favorite Authors */}
          <FavoriteAuthorReleases library={library} />
        </aside>
      </div>

      {/* Slide-over Google Drive Sync Drawer */}
      {isDriveOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 overflow-y-auto shadow-2xl relative animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Cloud className="w-5 h-5 text-amber-400" />
                <h2 className="font-semibold text-slate-100">クラウド連携・設定</h2>
              </div>
              <button
                onClick={() => setIsDriveOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <GoogleDriveSync
              library={library}
              onImportLibrary={(imported) => saveLibraryState(imported)}
            />
          </div>
        </div>
      )}

      {/* Book Detail & Reflection Modal */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onUpdateBook={handleUpdateBook}
          onDeleteBook={handleDeleteBook}
          onOpenShare={() => handleOpenShare(selectedBook)}
        />
      )}

      {/* Share Logs Studio Modal */}
      {isShareModalOpen && (
        <ShareLogsModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setShareTargetBook(undefined);
          }}
          library={library}
          targetBook={shareTargetBook}
          onImportBooks={handleImportBooks}
        />
      )}

      {/* Floating AI Literary Companion Chat */}
      <ChatCorner library={library} />
    </div>
  );
}
