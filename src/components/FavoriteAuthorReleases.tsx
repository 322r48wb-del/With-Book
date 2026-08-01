/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Calendar, ExternalLink, User } from 'lucide-react';

interface Release {
  id: string;
  author: string;
  title: string;
  releaseDate: string;
  description: string;
}

const mockReleases: Release[] = [
  {
    id: '1',
    author: '村上春樹',
    title: '街とその不確かな壁',
    releaseDate: '2023-04-13',
    description: '長い間封印されていた幻の名作が、新たな長編小説として結実。'
  },
  {
    id: '2',
    author: '東野圭吾',
    title: 'あなたが誰かを殺した',
    releaseDate: '2023-09-21',
    description: '加賀恭一郎シリーズ最新作。閑静な別荘地で起きた連続殺人事件。'
  }
];

export default function FavoriteAuthorReleases() {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-amber-400" />
        <h3 className="font-bold text-white">お気に入り著者の新刊情報</h3>
      </div>
      <div className="space-y-3">
        {mockReleases.map((item) => (
          <div key={item.id} className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3.5 flex justify-between items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-amber-400 mb-1">
                <User className="w-3.5 h-3.5" />
                <span>{item.author}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{item.releaseDate} 発売</span>
              </div>
              <h4 className="font-semibold text-white text-sm">{item.title}</h4>
              <p className="text-xs text-slate-400 mt-1 line-clamp-1">{item.description}</p>
            </div>
            <button className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-700/50 rounded-lg shrink-0">
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
