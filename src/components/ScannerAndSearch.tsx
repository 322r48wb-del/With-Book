/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { Search, Camera, Barcode } from 'lucide-react';

interface ScannerAndSearchProps {
  onSearch: (query: string) => void;
}

export default function ScannerAndSearch({ onSearch }: ScannerAndSearchProps) {
  const [query, setQuery] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onSearch(val);
  };

  return (
    <div className="relative flex items-center w-full">
      <Search className="w-4 h-4 absolute left-3 text-slate-400" />
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="タイトル、著者名で検索..."
        className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
      />
      <button className="absolute right-3 text-slate-400 hover:text-amber-400 p-1">
        <Barcode className="w-4 h-4" />
      </button>
    </div>
  );
}
