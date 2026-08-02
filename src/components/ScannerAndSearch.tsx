/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { Search, Plus, Loader2 } from 'lucide-react';
import { Book } from '../types';

interface Props {
  library?: Book[];
  onAddBook: (book: Omit<Book, 'id' | 'dateAdded' | 'userNotes' | 'rating' | 'status' | 'favorite'>) => void;
}

export default function ScannerAndSearch({ library = [], onAddBook }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const safeResults = Array.isArray(results) ? results : [];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      setResults([]);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#16191F] border border-[#212429] rounded-xl p-5 shadow-lg space-y-4">
      <h2 className="font-serif font-bold text-white text-base flex items-center gap-2">
        <Search className="w-5 h-5 text-amber-500" />
        本を検索して追加
      </h2>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#6B7280]" />
          <input
            type="text"
            placeholder="タイトル・著者名・ISBNを入力..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#0F1115] border border-[#212429] text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '検索'}
        </button>
      </form>

      {safeResults?.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {safeResults.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2.5 bg-[#0F1115] border border-[#212429] rounded-lg">
              <div className="truncate mr-2">
                <p className="text-xs font-bold text-white truncate">{item?.title || 'タイトル不明'}</p>
                <p className="text-[10px] text-[#6B7280] truncate">{item?.author || '著者不明'}</p>
              </div>
              <button
                onClick={() => onAddBook(item)}
                className="p-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
