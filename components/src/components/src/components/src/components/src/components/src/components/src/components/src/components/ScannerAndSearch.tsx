/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Camera, Search, Loader2, Plus, Check, Scan } from 'lucide-react';
import { Book } from '../types';

interface ScannerAndSearchProps {
  library: Book[];
  onAddBook: (book: Omit<Book, 'id' | 'dateAdded' | 'userNotes' | 'rating' | 'status' | 'favorite'>) => void;
}

// A collection of high-quality mock books for random barcode scan simulation
const MOCK_BARCODES = [
  { title: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi', isbn: '9780593135204', description: 'Ryland Grace is the sole survivor on a desperate, last-chance mission to save humanity, and he has to do it with an unexpected alien ally.' },
  { title: 'Deep Work', author: 'Cal Newport', genre: 'Self-Help', isbn: '9781455586691', description: 'One of the most valuable skills in our economy is becoming increasingly rare. If you master this skill, you will achieve extraordinary results.' },
  { title: 'Gone Girl', author: 'Gillian Flynn', genre: 'Thriller', isbn: '9780307588371', description: 'On a warm summer morning in North Carthage, Missouri, it is Nick and Amys fifth wedding anniversary. And then, Nick’s clever wife disappears.' },
  { title: 'The Hobbit', author: 'J.R.R. Tolkien', genre: 'Fantasy', isbn: '9780261102217', description: 'Bilbo Baggins is a hobbit who enjoys a comfortable, unambitious life, but his contentment is disturbed when the wizard Gandalf arrives.' },
  { title: 'Educated', author: 'Tara Westover', genre: 'Biography', isbn: '9780399590504', description: 'An unforgettable memoir about a young girl who, kept out of school in the mountains of Idaho, leaves her survivalist family to earn a PhD from Cambridge University.' },
  { title: 'Klara and the Sun', author: 'Kazuo Ishiguro', genre: 'Fiction', isbn: '9780593318171', description: 'An intriguing look at our rapidly changing modern world through the eyes of an unforgettable narrator: Klara, an Artificial Friend.' }
];

export default function ScannerAndSearch({ library, onAddBook }: ScannerAndSearchProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);

  const [isbnInput, setIsbnInput] = useState('');

  const audioContextRef = useRef<AudioContext | null>(null);

  // Play synthetic barcode scan scanner beep sound
  const playScanBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(1200, ctx.currentTime); // 1.2 kHz crisp beep
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      console.error('Audio beep failed:', e);
    }
  };

  // Simulate scanning a barcode using the gorgeous animated viewports, optionally with a real ISBN
  const handleBarcodeScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isScanning) return;
    setIsScanning(true);
    setScanSuccess(null);
    setScanMessage('Initializing viewfinder...');

    try {
      if (isbnInput.trim()) {
        // Real fetch via Google Books API based on user snippet
        setScanMessage('Querying Google Books API...');
        
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbnInput.trim()}`);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
          const bookInfo = data.items[0].volumeInfo;
          playScanBeep();
          
          onAddBook({
            title: bookInfo.title || 'Unknown Title',
            author: bookInfo.authors ? bookInfo.authors.join(', ') : 'Unknown Author',
            cover: bookInfo.imageLinks ? (bookInfo.imageLinks.thumbnail || bookInfo.imageLinks.smallThumbnail) : '',
            genre: bookInfo.categories ? bookInfo.categories[0] : 'General',
            isbn: isbnInput.trim(),
            description: bookInfo.description || '',
          });
          setScanSuccess(`Successfully scanned: "${bookInfo.title}"!`);
          setIsbnInput('');
        } else {
          setScanMessage('Book not found in database. Try another barcode!');
          setTimeout(() => setScanMessage(''), 3000);
        }
      } else {
        // Simulated fallback logic if no ISBN is provided
        await new Promise(resolve => setTimeout(resolve, 500));
        setScanMessage('Autofocusing optical lens...');

        await new Promise(resolve => setTimeout(resolve, 600));
        setScanMessage('Reading EAN-13 barcode block...');

        await new Promise(resolve => setTimeout(resolve, 700));

        // Find a book we haven't scanned yet, or grab any if all are scanned
        const unscanned = MOCK_BARCODES.filter(
          (mock) => !library.some((b) => b.title.toLowerCase() === mock.title.toLowerCase())
        );
        
        const selectedMock = unscanned.length > 0 
          ? unscanned[Math.floor(Math.random() * unscanned.length)]
          : MOCK_BARCODES[Math.floor(Math.random() * MOCK_BARCODES.length)];

        playScanBeep();
        onAddBook({ ...selectedMock, cover: '' });
        setScanSuccess(`Successfully scanned: "${selectedMock.title}"!`);
      }
    } catch (error) {
      console.error("Error fetching book data:", error);
      setScanMessage('Error fetching book data.');
      setTimeout(() => setScanMessage(''), 3000);
    } finally {
      setIsScanning(false);
    }
  };

  // Trigger search on Express backend
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const res = await fetch('/api/books/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to find matching books. Please try again.');
      }

      const data = await res.json();
      setSearchResults(data.books || []);
      if (data.books?.length === 0) {
        setSearchError('No matching published books found. Try refining the keywords.');
      }
    } catch (err: any) {
      console.error(err);
      setSearchError(err.message || 'An error occurred during book lookup.');
    } finally {
      setSearchLoading(false);
    }
  };

  const isAlreadyInLibrary = (title: string) => {
    return library.some((b) => b.title.toLowerCase() === title.toLowerCase());
  };

  return (
    <div className="bg-[#0F1115] rounded-xl border border-[#212429] shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <Scan className="w-5 h-5 text-amber-500" />
        <h3 className="font-serif font-semibold text-lg tracking-tight text-white">
          Add to Your Library
        </h3>
      </div>

      {/* Grid of options: simulated scanner or manual keyword search */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Optical simulated scanner viewport */}
        <div className="md:col-span-5 flex flex-col justify-between border border-[#212429] rounded-lg p-4 bg-[#16191F]/40 relative overflow-hidden min-h-[180px]">
          {isScanning ? (
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
              {/* Animated camera viewfinder border box */}
              <div className="w-32 h-20 border-2 border-amber-500 rounded-md relative flex flex-col items-center justify-center overflow-hidden bg-black/40">
                {/* Glowing red scan laser line */}
                <div className="absolute w-full h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-bounce" style={{ animationDuration: '1.4s' }} />
                <Camera className="w-6 h-6 text-[#9CA3AF] opacity-60 animate-pulse" />
              </div>
              <span className="text-[10px] text-[#9CA3AF] font-mono mt-3 animate-pulse">
                {scanMessage}
              </span>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-4 text-center z-10">
              <Camera className="w-8 h-8 text-[#4B5563] mb-2" />
              <p className="text-xs text-[#9CA3AF] font-sans max-w-[150px] leading-snug">
                Simulate a fast hardware barcode scanner camera.
              </p>
            </div>
          )}

          {scanSuccess && (
            <div className="absolute inset-0 bg-[#0A0B0D]/95 flex flex-col items-center justify-center text-center p-3 text-white z-20">
              <Check className="w-8 h-8 text-emerald-400 mb-2 animate-bounce" />
              <span className="text-xs font-serif leading-tight">{scanSuccess}</span>
              <button 
                onClick={() => setScanSuccess(null)}
                className="mt-3 text-[10px] tracking-wider uppercase font-mono text-[#9CA3AF] hover:text-white underline"
              >
                Clear
              </button>
            </div>
          )}

          <form onSubmit={handleBarcodeScan} className="mt-3 flex gap-2 w-full">
            <input
              type="text"
              placeholder="Enter ISBN (optional)"
              value={isbnInput}
              onChange={(e) => setIsbnInput(e.target.value)}
              disabled={isScanning}
              className="flex-1 px-3 py-2 text-xs bg-[#0F1115] border border-[#212429] rounded-lg focus:outline-none focus:border-amber-500 text-white font-mono placeholder:font-sans"
            />
            <button
              type="submit"
              disabled={isScanning}
              className="bg-white hover:bg-stone-200 text-black text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
            >
              <Scan className="w-3.5 h-3.5" />
              {isScanning ? 'Scanning...' : 'Scan'}
            </button>
          </form>
        </div>

        {/* Global Catalog Search */}
        <div className="md:col-span-7 flex flex-col justify-start">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Search catalog by title, author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-[#16191F] border border-[#212429] rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-white font-sans"
              />
            </div>
            <button
              type="submit"
              disabled={searchLoading || !searchQuery.trim()}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {searchLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
            </button>
          </form>

          {/* Search Results Display panel */}
          <div className="mt-4 flex-1 overflow-y-auto max-h-[160px] border border-[#212429] rounded-lg bg-[#16191F]/20 p-2 text-[#9CA3AF] text-xs flex flex-col gap-2">
            {searchLoading ? (
              <div className="flex items-center justify-center h-28 gap-2 font-serif italic text-amber-500">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                Browsing the universe for matches...
              </div>
            ) : searchError ? (
              <div className="text-center py-6 text-[#6B7280] font-serif italic px-2">
                {searchError}
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((book: any, idx: number) => {
                const added = isAlreadyInLibrary(book.title);
                return (
                  <div key={idx} className="flex items-center justify-between p-2 bg-[#16191F] rounded-lg border border-[#212429] shadow-xs hover:border-[#4B5563] transition-all">
                    <div className="flex-1 pr-3 truncate">
                      <h4 className="font-serif font-semibold text-white tracking-tight text-xs truncate">
                        {book.title}
                      </h4>
                      <p className="text-[10px] text-[#9CA3AF] truncate mt-0.5">
                        by {book.author} • <span className="italic text-[#6B7280]">{book.genre}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => !added && onAddBook({
                        title: book.title,
                        author: book.author,
                        genre: book.genre,
                        description: book.description,
                        isbn: book.isbn,
                        cover: `https://covers.openlibrary.org/b/isbn/${book.isbn?.replace(/[^0-9]/g, '') || ''}-M.jpg`
                      })}
                      disabled={added}
                      className={`px-2.5 py-1.5 rounded-md text-[10px] font-sans font-semibold transition-all flex items-center gap-1
                        ${added 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default' 
                          : 'bg-[#212429] hover:bg-amber-500 hover:text-black text-white border border-[#212429]'
                        }`}
                    >
                      {added ? (
                        <>
                          <Check className="w-3 h-3" />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          Add Log
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-[#6B7280] font-serif italic">
                No active searches. Enter query above to browse published books.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
