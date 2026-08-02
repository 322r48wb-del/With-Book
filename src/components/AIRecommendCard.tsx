/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Book } from '../types';

interface AIRecommendCardProps {
  books?: Book[]; // オプショナルにして安全化
}

export default function AIRecommendCard({ books = [] }: AIRecommendCardProps) {
  // books が undefined でも safeBooks は必ず配列になるようガード
  const safeBooks = Array.isArray(books) ? books : [];

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-slate-900 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">AI 本棚分析 & おすすめ</h3>
            <p className="text-xs text-slate-400">あなたの読書傾向から次の一冊を提案</p>
          </div>
        </div>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed mb-4">
        登録された{safeBooks.length}冊のデータを分析中。AIがあなたのお好みに合わせた本をピックアップします。
      </p>
      <div className="flex justify-end">
        <button className="flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2 rounded-xl border border-amber-500/30 transition-colors">
          おすすめを見る
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
