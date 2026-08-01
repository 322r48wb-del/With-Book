/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Sparkles, Send, X, Loader2, BookOpen, ChevronUp, AlertCircle, RefreshCw } from 'lucide-react';
import { Book } from '../types';

interface ChatCornerProps {
  library: Book[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatCorner({ library }: ChatCornerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string>('general');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I am Gemini, your reading companion. 📚\n\nI'd love to hear your thoughts and feelings about the books you are reading or have finished. Pick a book from the list above and tell me what you felt, what surprised you, or how it resonated with you!",
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Automatically scroll to bottom of chat when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle changing the active book context
  const handleBookChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bookId = e.target.value;
    setSelectedBookId(bookId);

    if (bookId === 'general') {
      setMessages([
        {
          role: 'assistant',
          content: "We are back in general literary discussion! Ask me about recommendations, compare books, or tell me about your overall reading journey.",
        },
      ]);
    } else {
      const book = library.find((b) => b.id === bookId);
      if (book) {
        let intro = `Let's talk about **"${book.title}"** by ${book.author}! 📖\n\n`;
        if (book.status === 'completed') {
          intro += `You have marked this book as **Completed** and rated it **${book.rating}/5 stars**. `;
        } else if (book.status === 'reading') {
          intro += `You are currently **Reading** this book. `;
        } else {
          intro += `This book is on your **To Read** list. `;
        }

        if (book.userNotes && book.userNotes.trim() !== '') {
          intro += `In your logs, you wrote: \n*"${book.userNotes}"*\n\n`;
        }

        intro += "What specifically stayed with you? Was there a character you loved, a pacing style that stood out, or an emotional twist that surprised you?";

        setMessages([
          {
            role: 'assistant',
            content: intro,
          },
        ]);
      }
    }
    setError(null);
  };

  // Helper function to render line breaks and bold markers in response text safely
  const formatMessageContent = (text: string) => {
    return text.split('\n').map((line, idx) => {
      // Find bold markers like **text**
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const parsedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-bold text-amber-400">{part.slice(2, -2)}</strong>;
        }
        // Match italic blockquotes starting with * and ending with *
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return <em key={pIdx} className="italic text-slate-300">{part.slice(1, -1)}</em>;
        }
        return part;
      });

      return (
        <p key={idx} className={idx > 0 ? "mt-1.5" : ""}>
          {parsedLine}
        </p>
      );
    });
  };

  // Clear chat history
  const handleClearChat = () => {
    if (selectedBookId === 'general') {
      setMessages([
        {
          role: 'assistant',
          content: "Hello! I am Gemini, your reading companion. 📚\n\nI'd love to hear your thoughts and feelings about the books you are reading or have finished. Pick a book from the list above and tell me what you felt!",
        },
      ]);
    } else {
      const book = library.find((b) => b.id === selectedBookId);
      if (book) {
        setMessages([
          {
            role: 'assistant',
            content: `Let's restart our conversation about **"${book.title}"**! What did you feel or think while reading this?`,
          },
        ]);
      }
    }
    setError(null);
  };

  // Send message to Gemini
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    setInputValue('');
    setError(null);

    // Append user message
    const newMessages = [...messages, { role: 'user' as const, content: userText }];
    setMessages(newMessages);
    setIsLoading(true);

    // Find selected book context
    const bookContext = selectedBookId !== 'general' ? library.find((b) => b.id === selectedBookId) : undefined;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          book: bookContext ? {
            title: bookContext.title,
            author: bookContext.author,
            description: bookContext.description,
            userNotes: bookContext.userNotes,
            rating: bookContext.rating,
            status: bookContext.status,
          } : undefined,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err.message || 'Something went wrong while talking to Gemini.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="gemini-chat-widget" className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 select-none animate-pulse-subtle border border-amber-600/30 group"
          style={{ animationDuration: '3s' }}
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 shrink-0" />
            <Sparkles className="w-2.5 h-2.5 text-amber-950 absolute -top-1 -right-1 group-hover:rotate-12 transition-transform" />
          </div>
          <span className="text-xs tracking-wider font-semibold uppercase">Chat with Gemini</span>
        </button>
      )}

      {/* Chat Drawer/Card */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[500px] bg-[#0F1115] border border-[#212429] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform scale-100 origin-bottom-right">
          {/* Header */}
          <div className="bg-[#16191F] border-b border-[#212429] px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-500">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-wider uppercase text-white flex items-center gap-1">
                  Gemini Companion
                </h3>
                <p className="text-[10px] text-[#6B7280]">Share and explore book feelings</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                className="p-1 text-[#6B7280] hover:text-white rounded-lg hover:bg-[#212429] transition-colors"
                title="Restart conversation"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-[#6B7280] hover:text-white rounded-lg hover:bg-[#212429] transition-colors"
                title="Minimize chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Book Selector Context Bar */}
          <div className="bg-[#0A0B0D] border-b border-[#212429] px-3 py-2 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
            <select
              value={selectedBookId}
              onChange={handleBookChange}
              className="flex-1 bg-transparent text-xs text-stone-300 font-medium border-none focus:outline-none focus:ring-0 cursor-pointer text-ellipsis overflow-hidden"
            >
              <option value="general" className="bg-[#0F1115] text-stone-300">
                📖 General Book Discussion
              </option>
              {library.map((b) => (
                <option key={b.id} value={b.id} className="bg-[#0F1115] text-stone-300">
                  📙 {b.title} ({b.author})
                </option>
              ))}
            </select>
          </div>

          {/* Message Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0A0B0D]/30 scrollbar-thin">
            {messages.map((msg, index) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={index}
                  className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} animate-fade-in`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2.5 text-xs leading-relaxed ${
                      isAssistant
                        ? 'bg-[#16191F] border border-[#212429] text-stone-200 rounded-tl-none font-sans'
                        : 'bg-amber-500 text-black font-medium rounded-tr-none shadow-md'
                    }`}
                  >
                    {isAssistant ? (
                      formatMessageContent(msg.content)
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loading / Thinking State */}
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-[#16191F] border border-[#212429] text-[#6B7280] rounded-xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                  <span>Gemini is reading your thoughts...</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3.5 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-red-300">
                      {error.toLowerCase().includes('api key') ? '🔑 API Key Required' : 'Connection Error'}
                    </p>
                    <p className="text-stone-300 leading-relaxed">{error}</p>
                  </div>
                </div>

                {error.toLowerCase().includes('api key') && (
                  <div className="mt-2 pt-2 border-t border-red-500/20 space-y-2 text-[11px] text-stone-300">
                    <div className="bg-[#16191F] p-2.5 rounded-lg border border-[#212429] space-y-1.5">
                      <p className="font-semibold text-amber-400 flex items-center gap-1">
                        💡 What is an API Key?
                      </p>
                      <p className="text-stone-400 leading-normal">
                        An <strong>API Key</strong> is a secret passcode that allows this app to send requests to Google's Gemini AI.
                      </p>
                    </div>

                    <div className="bg-[#16191F] p-2.5 rounded-lg border border-[#212429] space-y-1 text-stone-400">
                      <p className="font-semibold text-stone-200">How to fix in AI Studio:</p>
                      <ol className="list-decimal list-inside space-y-0.5 text-[#9CA3AF]">
                        <li>Click <strong>Settings</strong> (⚙️ icon) in the AI Studio top bar.</li>
                        <li>Open the <strong>Secrets</strong> section.</li>
                        <li>Set <code className="text-amber-400 bg-[#0A0B0D] px-1 py-0.5 rounded">GEMINI_API_KEY</code> to your Gemini key.</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Form Input */}
          <form onSubmit={handleSendMessage} className="bg-[#16191F] border-t border-[#212429] p-3 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                selectedBookId === 'general'
                  ? "Talk to Gemini about books..."
                  : "Tell Gemini what you felt reading this..."
              }
              disabled={isLoading}
              className="flex-1 bg-[#0A0B0D] border border-[#212429] rounded-lg px-3 py-2 text-xs text-white placeholder-[#6B7280] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="p-2 bg-amber-500 hover:bg-amber-400 disabled:bg-[#212429] disabled:text-[#6B7280] text-black font-bold rounded-lg transition-colors flex items-center justify-center shrink-0"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
