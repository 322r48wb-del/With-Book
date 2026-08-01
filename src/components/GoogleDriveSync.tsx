/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { Cloud, CloudUpload, CloudDownload, Check, RefreshCw } from 'lucide-react';

export default function GoogleDriveSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1500);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-md flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
          <Cloud className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Google ドライブバックアップ</h4>
          <p className="text-xs text-slate-400">
            {lastSynced ? `最終同期: ${lastSynced}` : '未同期'}
          </p>
        </div>
      </div>
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-slate-700 disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? '同期中...' : '今すぐ同期'}
      </button>
    </div>
  );
}
