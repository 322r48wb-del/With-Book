import React, { useState } from 'react';
import { Book } from '../types';
import { X, Star, Trash2, Edit2, Check, Sparkles, BookOpen, Quote, Share2 } from 'lucide-react';
import { BookCover } from './BookCover';

interface BookDetailModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedBook: Book) => void;
  onDelete: (id: string) => void;
  onOpenShare?: (bookId: string) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onOpenShare,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedBook, setEditedBook] = useState<Book | null>(null);

  React.useEffect(() => {
    setEditedBook(book);
    setIsEditing(false);
  }, [book]);

  if (!isOpen || !book || !editedBook) return null;

  const handleSave = () => {
    onUpdate(editedBook);
    setIsEditing(false);
  };

  const handleRatingChange = (rating: number) => {
    setEditedBook({ ...editedBook, rating });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <BookOpen className="w-4 h-4 text-amber-500" />
            <span>読書ログ詳細</span>
          </div>
          
          <div className="flex items-center gap-2">
            {onOpenShare && (
              <button
                onClick={() => {
                  onClose();
                  onOpenShare(book.id);
                }}
                className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-amber-200"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>ログを共有</span>
              </button>
            )}

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>編集</span>
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>保存</span>
              </button>
            )}

            <button
              onClick={() => onDelete(book.id)}
              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
              title="削除"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Main Info Section */}
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="shrink-0 w-32 shadow-lg rounded-lg overflow-hidden border border-slate-100">
              <BookCover title={book.title} author={book.author} coverUrl={book.coverUrl} />
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 leading-snug">{book.title}</h2>
                <p className="text-sm font-medium text-slate-500">{book.author}</p>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-400 mr-1">評価:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    disabled={!isEditing}
                    onClick={() => handleRatingChange(star)}
                    className={`${isEditing ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= editedBook.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-200'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Tags/Categories */}
              {book.category && (
                <div className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
                  {book.category}
                </div>
              )}
            </div>
          </div>

          {/* Emotional Quadrant Tag */}
          {book.quadrant && (
            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3.5 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <div className="text-xs font-bold text-amber-900">読後感の分類</div>
                <div className="text-xs text-amber-700 font-medium">{book.quadrant}</div>
              </div>
            </div>
          )}

          {/* Favorite Quote Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Quote className="w-3.5 h-3.5" /> 心に残ったフレーズ・引用
            </label>
            {isEditing ? (
              <textarea
                value={editedBook.quote || ''}
                onChange={(e) => setEditedBook({ ...editedBook, quote: e.target.value })}
                placeholder="本の中で印象的だった一言を記録..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[80px]"
              />
            ) : (
              <div className="p-4 bg-slate-50 border-l-4 border-amber-400 rounded-r-xl italic text-sm text-slate-700">
                {book.quote || '（引用文は未登録です）'}
              </div>
            )}
          </div>

          {/* Memo / Journal Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              感想・読書メモ
            </label>
            {isEditing ? (
              <textarea
                value={editedBook.memo || ''}
                onChange={(e) => setEditedBook({ ...editedBook, memo: e.target.value })}
                placeholder="読後の感想や学んだことを自由に書きましょう..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[120px]"
              />
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-700 whitespace-pre-wrap leading-relaxed min-h-[100px]">
                {book.memo || '（感想・メモは未登録です）'}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>追加日: {book.addedAt ? new Date(book.addedAt).toLocaleDateString() : '不明'}</span>
          {onOpenShare && (
            <button
              onClick={() => {
                onClose();
                onOpenShare(book.id);
              }}
              className="text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>この本を友達に教える</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};    
