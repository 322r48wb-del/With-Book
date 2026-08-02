import React from 'react';

interface BookCoverProps {
  title?: string;
  author?: string;
  genre?: string;
  isbn?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function BookCover({
  title = 'Untitled',
  author = 'Unknown',
  genre = 'General',
  isbn = '',
  size = 'md'
}: BookCoverProps) {
  const safeTitle = title || 'Untitled';
  const safeAuthor = author || 'Unknown';
  const safeGenre = genre || 'General';

  const sizeClasses = {
    sm: 'w-16 h-24 text-[10px]',
    md: 'w-24 h-36 text-xs',
    lg: 'w-36 h-52 text-sm'
  };

  // 文字列長に基づくグラデーションシード
  const seed = (safeTitle?.length || 0) + (safeAuthor?.length || 0);
  const bgGradients = [
    'from-slate-800 to-slate-950 border-slate-700',
    'from-stone-800 to-stone-950 border-stone-700',
    'from-amber-950/40 to-stone-900 border-amber-900/40',
    'from-zinc-800 to-zinc-950 border-zinc-700'
  ];
  const gradientClass = bgGradients[seed % bgGradients.length];

  return (
    <div
      className={`${sizeClasses[size]} bg-gradient-to-br ${gradientClass} border rounded-lg shadow-md flex flex-col justify-between p-2.5 relative overflow-hidden shrink-0 select-none`}
    >
      <div className="text-[9px] font-mono tracking-wider uppercase text-amber-500/80 truncate">
        {safeGenre}
      </div>
      <div className="my-auto">
        <h4 className="font-serif font-bold text-white leading-tight line-clamp-3">
          {safeTitle}
        </h4>
        <p className="text-[10px] text-stone-400 font-sans mt-1 truncate">
          {safeAuthor}
        </p>
      </div>
      <div className="text-[8px] font-mono text-stone-600 truncate">
        {isbn || 'NO-ISBN'}
      </div>
    </div>
  );
}
