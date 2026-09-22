import React, { useState, useEffect } from 'react';
import BookPositioningMap from '../components/BookPositioningMap';
import BookDetailModal from '../components/BookDetailModal';
import ShareLogsModal from '../components/ShareLogsModal';

// --- 型定義 ---
export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  x: number; // -100 to 100
  y: number; // -100 to 100
  status: 'unread' | 'reading' | 'completed';
  rating?: number;
  notes?: string;
  tags?: string[];
}

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <header className="p-4 border-b border-slate-800 flex justify-between items-center">
        <h1 className="text-xl font-bold">With Book</h1>
        <button
          onClick={() => setIsShareModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition"
        >
          ログを共有
        </button>
      </header>

      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        <BookPositioningMap
          books={books}
          onSelectBook={(book) => setSelectedBook(book)}
        />
      </main>

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
