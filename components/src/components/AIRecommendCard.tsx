import React, { useState } from 'react';
import { Sparkles, Plus, RefreshCw } from 'lucide-react';
import { Book, AIRecommendation } from '../types';

interface AIRecommendCardProps {
  library?: Book[];
  onAddRecommendation: (rec: AIRecommendation) => void;
}

export default function AIRecommendCard({ library = [], onAddRecommendation }: AIRecommendCardProps) {
  const safeLibrary = Array.isArray(library) ? library : [];
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([
    {
      title: 'Project Hail Mary',
      author: 'Andy Weir',
      genre: 'Sci-Fi',
      reason: 'Because you enjoyed Dune and complex survival science puzzles.'
    }
  ]);

  const safeRecommendations = Array.isArray(recommendations) ? recommendations : [];

  return (
    <div className="bg-[#16191F] border border-[#212429] rounded-xl p-5 shadow-lg relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
          <h2 className="font-serif font-bold text-white text-sm tracking-wide">
            AI RECOMMENDED READS
          </h2>
        </div>
      </div>

      {safeRecommendations.length === 0 ? (
        <p className="text-xs text-stone-500 italic">No recommendations available.</p>
      ) : (
        <div className="space-y-3">
          {safeRecommendations.map((rec, idx) => (
            <div key={idx} className="bg-[#0F1115] border border-[#212429] p-3 rounded-lg flex flex-col justify-between gap-2">
              <div>
                <h4 className="font-serif font-bold text-white text-xs">{rec?.title}</h4>
                <p className="text-[10px] text-[#6B7280]">by {rec?.author} • {rec?.genre}</p>
                <p className="text-[11px] text-[#9CA3AF] italic mt-1 font-serif">"{rec?.reason}"</p>
              </div>
              <button
                onClick={() => onAddRecommendation(rec)}
                className="self-end text-[10px] font-sans font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" /> Add to List
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
