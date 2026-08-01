/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { X, Heart, Star, Calendar, MessageSquare, Quote, Trash2 } from 'lucide-react';
import { Book, ReadingStatus } from '../types';
import BookCover from './BookCover';

interface BookDetailModalProps {
  book: Book;
  onClose: () => void;
  onSave: (updatedBook: Book) => void;
  onDelete: (bookId: string) => void;
}

export default function BookDetailModal({ book, onClose, onSave, onDelete }: BookDetailModalProps) {
  const [status, setStatus] = useState<ReadingStatus>(book.status);
  const [rating, setRating] = useState<number>(book.rating);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [userNotes, setUserNotes] = useState<string>(book.userNotes || '');
  const [favorite, setFavorite] = useState<boolean>(book.favorite || false);
  const [dateStarted, setDateStarted] = useState<string>(book.dateStarted || '');
  const [dateCompleted, setDateCompleted] = useState<string>(book.dateCompleted || '');

  const [quotes, setQuotes] = useState<string[]>(book.keyQuotes || []);
  const [newQuote, setNewQuote] = useState<string>('');

  useEffect(() => {
    setStatus(book.status);
    setRating(book.rating);
    setUserNotes(book.userNotes || '');
    setFavorite(book.favorite || false);
    setDateStarted(book.dateStarted || '');
    setDateCompleted(book.dateCompleted || '');
    setQuotes(book.keyQuotes || []);
  }, [book]);

  const handleSave = () => {
    onSave({
      ...book,
      status,
      rating,
      userNotes,
      favorite,
      dateStarted,
      dateCompleted,
      keyQuotes: quotes
    });
    onClose();
  };

  const handleAddQuote = () => {
    if (newQuote.trim()) {
      setQuotes([...quotes, newQuote.trim()]);
      setNewQuote('');
    }
  };

  const handleRemoveQuote = (index: number) => {
    setQuotes(quotes.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-start sticky top-0 bg-slate-900/90 backdrop-blur z-10">
          <div className="flex gap-4">
            <BookCover title={book.title} author={book.author} coverUrl={book.coverUrl} className="w-16 h-24 shrink-0" />
            <div>
              <h2 className="text-xl font-bold text-white">{book.title}</h2>
              <p className="text-sm text-slate-400 mt-1">{book.author}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-wrap gap-4 items-center justify-between bg-slate-800/40 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">読書ステータス</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ReadingStatus)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="unread">未読</option>
                <option value="reading">読書中</option>
                <option value="completed">読了</option>
                <option value="wishlist">読みたい</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">評価</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        (hoverRating || rating) >= star
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">お気に入り</label>
              <button
                type="button"
                onClick={() => setFavorite(!favorite)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                  favorite
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${favorite ? 'fill-rose-400' : ''}`} />
                {favorite ? 'お気に入り' : '追加する'}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-amber-400" /> 感想・メモ
            </label>
            <textarea
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              rows={4}
              placeholder="この本から得た気づきや印象に残ったシーンを入力..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-2 flex items-center gap-1.5">
              <Quote className="w-4 h-4 text-amber-400" /> 心に残ったフレーズ
            </label>
            <div className="space-y-2 mb-3">
              {quotes.map((q, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-800/60 border border-slate-700/50 p-2.5 rounded-lg text-sm text-slate-200">
                  <p className="italic">"{q}"</p>
                  <button onClick={() => handleRemoveQuote(idx)} className="text-slate-500 hover:text-rose-400 ml-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newQuote}
                onChange={(e) => setNewQuote(e.target.value)}
                placeholder="引用文を入力..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleAddQuote}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                追加
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 flex justify-between items-center bg-slate-900/90">
          <button
            onClick={() => {
              if (confirm('この本を本棚から削除しますか？')) {
                onDelete(book.id);
                onClose();
              }
            }}
            className="text-rose-400 hover:text-rose-300 text-sm font-medium flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" /> 削除する
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-sm transition-colors"
            >
              保存する
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
