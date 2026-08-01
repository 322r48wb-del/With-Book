/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

interface BookCoverProps {
  title: string;
  author: string;
  genre: string;
  coverUrl?: string;
  isbn?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function BookCover({
  title,
  author,
  genre,
  coverUrl,
  isbn,
  size = 'md',
}: BookCoverProps) {
  const [imageError, setImageError] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    setImageError(false);
    if (coverUrl) {
      setResolvedUrl(coverUrl);
    } else if (isbn) {
      // Clean up ISBN (only numbers)
      const cleanIsbn = isbn.replace(/[^0-9]/g, '');
      if (cleanIsbn) {
        setResolvedUrl(`https://covers.openlibrary.org/b/isbn/${cleanIsbn}-M.jpg`);
      } else {
        setResolvedUrl(undefined);
      }
    } else {
      setResolvedUrl(undefined);
    }
  }, [coverUrl, isbn]);

  const getGenreStyle = (g: string) => {
    const genreLower = g.toLowerCase();
    if (genreLower.includes('sci-fi') || genreLower.includes('fiction') || genreLower.includes('space')) {
      return {
        bg: 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900',
        accent: 'border-indigo-400/30',
        text: 'text-indigo-200',
        badge: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/50',
      };
    }
    if (genreLower.includes('thriller') || genreLower.includes('mystery') || genreLower.includes('horror')) {
      return {
        bg: 'bg-gradient-to-br from-zinc-950 via-rose-950 to-neutral-900',
        accent: 'border-rose-900/30',
        text: 'text-rose-200',
        badge: 'bg-rose-950/80 text-rose-300 border-rose-900/50',
      };
    }
    if (genreLower.includes('self-help') || genreLower.includes('business') || genreLower.includes('motivation')) {
      return {
        bg: 'bg-gradient-to-br from-amber-950 via-stone-900 to-amber-950',
        accent: 'border-amber-700/30',
        text: 'text-amber-200',
        badge: 'bg-amber-950/80 text-amber-300 border-amber-800/50',
      };
    }
    if (genreLower.includes('classic') || genreLower.includes('history') || genreLower.includes('biography')) {
      return {
        bg: 'bg-gradient-to-br from-emerald-950 via-stone-900 to-emerald-950',
        accent: 'border-emerald-800/30',
        text: 'text-emerald-100',
        badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-900/50',
      };
    }
    // Default elegant warm terracotta/linen look
    return {
      bg: 'bg-gradient-to-br from-orange-950 via-stone-900 to-stone-950',
      accent: 'border-orange-900/30',
      text: 'text-orange-200',
      badge: 'bg-orange-950/80 text-orange-200 border-orange-900/50',
    };
  };

  const styles = getGenreStyle(genre);

  // Define dimension classes
  const dimensions = {
    sm: 'w-16 h-24 text-[10px]',
    md: 'w-28 h-40 text-xs',
    lg: 'w-36 h-52 text-sm',
    xl: 'w-48 h-64 text-base',
  };

  if (resolvedUrl && !imageError) {
    return (
      <div className={`relative ${dimensions[size]} rounded-md overflow-hidden shadow-lg border border-stone-200/50 transition-all duration-300 hover:scale-[1.02]`}>
        <img
          src={resolvedUrl}
          alt={title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
        {/* Subtle realistic book page edge on the right and spine highlight on the left */}
        <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-gradient-to-r from-black/30 to-transparent pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-0.5 bg-black/10 pointer-events-none" />
      </div>
    );
  }

  // Fallback beautiful hardcover visual
  return (
    <div
      className={`relative ${dimensions[size]} ${styles.bg} rounded-md p-3 flex flex-col justify-between shadow-xl border-l-4 border-l-black/40 border-y border-r border-stone-800/20 overflow-hidden select-none transition-all duration-300 hover:scale-[1.02]`}
    >
      {/* Editorial geometric decorative elements on background */}
      <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
        <div className="w-24 h-24 rounded-full border border-stone-100" />
        <div className="absolute w-16 h-16 border border-stone-100 transform rotate-45" />
      </div>

      {/* Header Badge */}
      <div className="z-10 flex justify-between items-start">
        <span className={`px-1.5 py-0.5 rounded text-[8px] tracking-widest uppercase border font-mono ${styles.badge} truncate max-w-full`}>
          {genre || 'Book'}
        </span>
      </div>

      {/* Central Book Title & Author */}
      <div className="z-10 my-auto text-center flex flex-col gap-1.5 px-1">
        <h4 className={`font-serif font-semibold tracking-tight text-stone-100 leading-tight line-clamp-3 
          ${size === 'sm' ? 'text-[9px]' : size === 'md' ? 'text-[13px]' : size === 'lg' ? 'text-base' : 'text-xl'}
        `}>
          {title}
        </h4>
        <p className={`font-sans font-light tracking-wide italic text-stone-300 truncate
          ${size === 'sm' ? 'text-[8px]' : 'text-[10px]'}
        `}>
          {author}
        </p>
      </div>

      {/* Footer Branding */}
      <div className="z-10 flex justify-center items-center opacity-60 font-serif italic text-stone-400">
        <span className={size === 'sm' ? 'text-[6px]' : 'text-[8px] tracking-wider'}>with book</span>
      </div>

      {/* Shadow overlays to create a 3D binding look */}
      <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-gradient-to-r from-black/40 via-black/20 to-transparent pointer-events-none" />
      <div className="absolute top-0 bottom-0 left-2.5 w-1 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-1 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />
    </div>
  );
}
