import React, { useState } from 'react';
import BookPositioningMap, { Book } from './components/BookPositioningMap';
import BookDetailModal from './components/BookDetailModal';
import ShareLogsModal from './components/ShareLogsModal';

// AI Studioの初期データ（サンプル本データ）
const INITIAL_BOOKS: Book[] = [
  {
    id: '1',
    title: 'マオ王',
    author: 'サンプル著者',
    x: 40,
    y: 60,
    status: 'reading',
    rating: 5,
    notes: '引き込まれるストーリー展開。',
    tags: ['ファンタジー', '小説'],
    genre: '小説',
  },
  {
    id: '2',
    title: '思考の整理学',
    author: '外山滋比古',
    x: -50,
    y: 70,
    status: 'completed',
    rating: 4,
    notes: 'アイデア出しの参考になる。',
    tags: ['思考法', 'ビジネス'],
    genre: 'ビジネス・実用',
  },
  {
    id: '3',
    title: 'デザインの解剖',
    author: '佐藤卓',
    x: 70,
    y: -30,
    status: 'unread',
    rating: 4,
    tags: ['デザイン', 'アート'],
    genre: 'アート',
  },
];

export default function App() {
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleAddBookAtPosition = (x: number, y: number) => {
    const newBook: Book = {
      id: Date.now().toString(),
      title: '新しい本',
      author: '著者未設定',
      x,
      y,
      status: 'unread',
      tags: ['新規'],
    };
    setBooks((prev) => [...prev, newBook]);
    setSelectedBook(newBook);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* ヘッダー */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 font-bold text-lg text-white">
              W
            </div>
            <div>
              <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                With Book
              </h1>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                読書マップ & アナリティクス
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-sm font-medium shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684" />
              </svg>
              ログを共有
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        {/* タイトルセクション */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-800/60 pb-6">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">ポジショニングマップ</h2>
            <p className="text-sm text-slate-400 mt-1">
              マップをクリックして新しい本を追加するか、配置済みの本を選択して詳細を確認できます。
            </p>
          </div>
          <div className="text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
            登録数: <span className="text-indigo-400 font-semibold">{books.length}</span> 冊
          </div>
        </div>

        {/* 2軸ポジショニングマップコンポーネント */}
        <BookPositioningMap
          books={books}
          onSelectBook={(book) => setSelectedBook(book)}
          onAddBook={handleAddBookAtPosition}
        />
      </main>

      {/* モーダル群 */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}

      {isShareModalOpen && (
        <ShareLogsModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </div>
  );
}
