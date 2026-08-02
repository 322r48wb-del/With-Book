/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Sparkles } from 'lucide-react';
import { Book } from '../types';

interface Props {
  library?: Book[];
  onAddBook: (release: Omit<Book, 'id' | 'dateAdded'>) => void;
}

export default function FavoriteAuthorReleases({ library = [] }: Props) {
  const safeLibrary = Array.isArray(library) ? library : [];

  const favoriteAuthors = Array.from(
    new Set(
      safeLibrary
        .filter((b) => Boolean(b?.favorite) && Boolean(b?.author))
        .map((b) => b.author)
    )
  );

  if (favoriteAuthors?.length === 0) return null;

  return (
    <div className="bg-[#16191F] border border-[#212429] rounded-xl p-4 shadow-md space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <h3 className="font-serif font-bold text-sm text-white">お気に入り著者の新刊チェック</h3>
      </div>
      <p className="text-xs text-[#9CA3AF]">
        追跡中: <span className="text-amber-400 font-semibold">{favoriteAuthors.join(', ')}</span>
      </p>
    </div>
  );
}
