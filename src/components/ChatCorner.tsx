/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { Book } from '../types';

interface Props {
  library?: Book[];
}

export default function ChatCorner({ library = [] }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([]);

  const safeMessages = Array.isArray(messages) ? messages : [];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setInput('');
    setMessages((prev) => [...(Array.isArray(prev) ? prev : []), { sender: 'user', text: userText }]);

    setTimeout(() => {
      setMessages((prev) => [
        ...(Array.isArray(prev) ? prev : []),
        { sender: 'ai', text: '本棚の記録に基づいて回答を作成します。' }
      ]);
    }, 600);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3.5 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-full shadow-2xl transition-transform hover:scale-105 flex items-center gap-2"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-xs font-bold pr-1">Book Chat</span>
        </button>
      ) : (
        <div className="bg-[#16191F] border border-[#212429] rounded-2xl w-80 sm:w-96 h-96 flex flex-col shadow-2xl overflow-hidden">
          <div className="p-3.5 bg-[#0F1115] border-b border-[#212429] flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-500" />
              読書アシスタント
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-[#6B7280] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-2">
            {safeMessages?.length === 0 ? (
              <p className="text-[11px] text-[#6B7280] text-center mt-12">
                読んだ本に関する質問や感想を入力してください。
              </p>
            ) : (
              safeMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-2.5 rounded-xl text-xs ${
                      msg.sender === 'user'
                        ? 'bg-amber-500 text-black font-medium'
                        : 'bg-[#212429] text-white'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSend} className="p-2.5 border-t border-[#212429] bg-[#0F1115] flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="メッセージを入力..."
              className="flex-1 px-3 py-1.5 text-xs bg-[#16191F] border border-[#212429] text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              type="submit"
              className="p-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-600 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
