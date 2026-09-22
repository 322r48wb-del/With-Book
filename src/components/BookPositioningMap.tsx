import React, { useState } from 'react';

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
  genre?: string;
  isbn?: string;
}

interface BookPositioningMapProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
  onAddBook?: (x: number, y: number) => void;
}

export default function BookPositioningMap({
  books,
  onSelectBook,
  onAddBook,
}: BookPositioningMapProps) {
  const [hoveredBook, setHoveredBook] = useState<Book | null>(null);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onAddBook) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // クリック位置を -100 ~ 100 の座標に変換
    const mapX = Math.round(((clickX / rect.width) * 200) - 100);
    const mapY = Math.round(100 - ((clickY / rect.height) * 200));

    onAddBook(mapX, mapY);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* 2軸マップコンテナ */}
      <div 
        onClick={handleMapClick}
        className="relative w-full aspect-square max-h-[600px] bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-hidden backdrop-blur-md cursor-crosshair group select-none"
      >
        {/* 背景グリッド & エフェクト */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />
        
        {/* 軸の十字線 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-[1px] bg-indigo-500/30" />
          <div className="h-full w-[1px] bg-indigo-500/30 absolute" />
        </div>

        {/* X軸 / Y軸 ラベル */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900/90 border border-slate-700/50 rounded-full text-xs text-indigo-300 font-medium tracking-wide shadow">
          思考的 / 深い (+)
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900/90 border border-slate-700/50 rounded-full text-xs text-indigo-300 font-medium tracking-wide shadow">
          感覚的 / 手軽 (-)
        </div>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 px-1.5 py-3 bg-slate-900/90 border border-slate-700/50 rounded-full text-xs text-indigo-300 font-medium tracking-wide shadow [writing-mode:vertical-lr]">
          実用 / ビジネス (-)
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-3 bg-slate-900/90 border border-slate-700/50 rounded-full text-xs text-indigo-300 font-medium tracking-wide shadow [writing-mode:vertical-lr]">
          物語 / アート (+)
        </div>

        {/* 配置された本の一覧 */}
        <div className="relative w-full h-full">
          {books.map((book) => {
            const leftPercent = ((book.x + 100) / 200) * 100;
            const topPercent = ((100 - book.y) / 200) * 100;

            return (
              <div
                key={book.id}
                style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 hover:z-30 transition-all duration-200"
                onMouseEnter={() => setHoveredBook(book)}
                onMouseLeave={() => setHoveredBook(null)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectBook(book);
                  }}
                  className="group relative flex flex-col items-center focus:outline-none"
                >
                  <div className="w-12 h-16 rounded-md bg-gradient-to-br from-indigo-600 to-slate-800 p-0.5 shadow-lg shadow-indigo-950/50 group-hover:scale-110 group-hover:shadow-indigo-500/30 transition-all overflow-hidden border border-indigo-400/30">
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover rounded-[3px]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-1 bg-slate-900 text-[10px] font-bold text-center leading-tight text-slate-200">
                        {book.title}
                      </div>
                    )}
                  </div>

                  {/* ホバー時のミニツールチップ */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center pointer-events-none min-w-[120px]">
                    <div className="bg-slate-900/95 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 shadow-xl text-center backdrop-blur">
                      <p className="font-semibold line-clamp-1">{book.title}</p>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{book.author}</p>
                    </div>
                    <div className="w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45 -mt-1" />
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
