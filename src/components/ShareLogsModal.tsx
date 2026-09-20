import React, { useState } from 'react';
import { Book } from '../types';
import {
  X,
  Copy,
  Check,
  Share2,
  Sparkles,
  BookOpen,
  User,
  Send,
  CheckCircle2
} from 'lucide-react';

interface ShareLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  selectedBookId?: string | null;
}

export const ShareLogsModal: React.FC<ShareLogsModalProps> = ({
  isOpen,
  onClose,
  books,
  selectedBookId = null
}) => {
  const [shareScope, setShareScope] = useState<'library' | 'single'>(
    selectedBookId ? 'single' : 'library'
  );
  const [activeBookId, setActiveBookId] = useState<string>(
    selectedBookId || books[0]?.id || ''
  );
  const [userName, setUserName] = useState('');
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  const targetBook = books.find((b) => b.id === activeBookId) || books[0];

  const generateShareData = () => {
    const payload = {
      version: '1.0',
      type: shareScope,
      sender: userName.trim() || '読書好きの仲間',
      note: note.trim(),
      timestamp: new Date().toISOString(),
      books: shareScope === 'single' && targetBook ? [targetBook] : books
    };
    const jsonString = JSON.stringify(payload);
    const encoded = btoa(encodeURIComponent(jsonString));
    const shareUrl = `${window.location.origin}${window.location.pathname}?share=${encoded}`;
    return { payload, shareUrl };
  };

  const generateSummaryText = () => {
    const sender = userName.trim() || '読書仲間';
    if (shareScope === 'single' && targetBook) {
      return `📚 【${sender}のおすすめ読書記録】\n『${targetBook.title}』(${targetBook.author})\n評価: ${'★'.repeat(targetBook.rating)}${'☆'.repeat(5 - targetBook.rating)}\n${targetBook.userNotes ? `💬 感想: "${targetBook.userNotes}"\n` : ''}${note ? `📝 メッセージ: ${note}\n` : ''}\n#WithBook #読書記録`;
    }
    return `📚 【${sender}の読書ライブラリ Passport】\n合計 ${books.length} 冊の読書ログを共有しました！\n${note ? `📝 メッセージ: ${note}\n` : ''}\n#WithBook #読書記録`;
  };

  const handleCopyLink = () => {
    const { shareUrl } = generateShareData();
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyText = () => {
    const text = generateSummaryText();
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleNativeShare = async () => {
    const { shareUrl } = generateShareData();
    const text = generateSummaryText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'With Book 読書ログ共有',
          text: text,
          url: shareUrl
        });
      } catch (e) {
        console.error('Share failed', e);
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg">読書ログを共有する</h2>
              <p className="text-xs text-slate-500">あなたの読書体験や本棚を友達にシェアできます</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Scope Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              共有の範囲を選択
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShareScope('library')}
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  shareScope === 'library'
                    ? 'border-amber-500 bg-amber-50/60 text-amber-900 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <BookOpen className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <div className="font-semibold text-sm">全ライブラリ（{books.length}冊）</div>
                  <div className="text-xs text-slate-500">本棚全体のコレクションをまるごと共有</div>
                </div>
              </button>

              <button
                onClick={() => setShareScope('single')}
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  shareScope === 'single'
                    ? 'border-amber-500 bg-amber-50/60 text-amber-900 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <div className="font-semibold text-sm">1冊の読書記録</div>
                  <div className="text-xs text-slate-500">特定の本のメモや評価をピックアップ</div>
                </div>
              </button>
            </div>
          </div>

          {/* Book Selector if single */}
          {shareScope === 'single' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                共有する本を選択
              </label>
              <select
                value={activeBookId}
                onChange={(e) => setActiveBookId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} （{b.author}）
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sender Info & Note */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> あなたのお名前 (任意)
              </label>
              <input
                type="text"
                placeholder="例: たろう"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                <Send className="w-3.5 h-3.5" /> 一言メッセージ (任意)
              </label>
              <input
                type="text"
                placeholder="例: この本すごく良かったよ！"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Preview Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">共有プレビュー</div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 text-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md font-medium">
                <span>読書パスポート ID: #{Math.floor(Math.random() * 8999 + 1000)}</span>
                <span>{userName.trim() || '読書仲間'} からのシェア</span>
              </div>
              {shareScope === 'single' && targetBook ? (
                <div className="pt-2">
                  <div className="font-bold text-slate-800">{targetBook.title}</div>
                  <div className="text-xs text-slate-500">{targetBook.author}</div>
                  {targetBook.userNotes && (
                    <p className="mt-2 text-xs italic text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                      "{targetBook.userNotes}"
                    </p>
                  )}
                </div>
              ) : (
                <div className="pt-2 flex items-center gap-3">
                  <div className="text-2xl font-black text-amber-600">{books.length}</div>
                  <div className="text-xs text-slate-600">
                    冊の読書コレクションと評価データが含まれています
                  </div>
                </div>
              )}
              {note && (
                <div className="text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <span className="font-semibold text-slate-700">メッセージ: </span> {note}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2 justify-between items-center">
          <button
            onClick={handleCopyText}
            className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-medium text-xs flex items-center gap-2 transition-colors shadow-sm"
          >
            {copiedText ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copiedText ? 'テキスト用コピー完了' : 'テキストをコピー'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium text-xs flex items-center gap-2 transition-colors shadow-sm"
            >
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'リンクをコピーしました' : '共有リンクを発行してコピー'}
            </button>
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleNativeShare}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium text-xs flex items-center gap-2 transition-colors shadow-sm"
              >
                <Share2 className="w-4 h-4" /> シェアする
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareLogsModal;
