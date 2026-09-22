import React from 'react';

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  x: number;
  y: number;
  status: 'unread' | 'reading' | 'completed';
  rating?: number;
  notes?: string;
  tags?: string[];
}

interface BookPositioningMapProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
}

export default function BookPositioningMap({ books, onSelectBook }: BookPositioningMapProps) {
  return (
    <div className="relative w-full h-[500px] bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col justify-between">
      {/* 軸のラベル */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-slate-400 font-medium">
        思考的 / 深い
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-slate-400 font-medium">
        感覚的 / 手軽
      </div>
      <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium [writing-mode:vertical-lr]">
        実用 / ビジネス
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium [writing-mode:vertical-lr]">
        物語 / アート
      </div>

      {/* グリッド線 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-full h-[1px] bg-slate-700/50" />
        <div className="h-full w-[1px] bg-slate-700/50 absolute" />
      </div>

      {/* 本のアイコン配置エリア */}
      <div className="relative w-full h-full">
        {books.map((book) => {
          // -100 ~ 100 の座標を 0% ~ 100% に変換
          const leftPercent = ((book.x + 100) / 200) * 100;
          const topPercent = ((100 - book.y) / 200) * 100;

          return (
            <button
              key={book.id}
              onClick={() => onSelectBook(book)}
              style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none"
              title={book.title}
            >
              <div className="w-10 h-14 bg-indigo-600 rounded shadow-md flex items-center justify-center text-xs font-bold border border-indigo-400 group-hover:scale-110 transition-transform overflow-hidden">
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="p-1 line-clamp-2 text-[10px] leading-tight text-center">
                    {book.title}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
