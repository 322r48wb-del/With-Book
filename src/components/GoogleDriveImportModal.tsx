import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudLightning, 
  Download, 
  Upload, 
  RefreshCw, 
  AlertCircle, 
  FileText, 
  Check, 
  LogOut, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  Copy
} from 'lucide-react';
import { Book } from '../types';

interface GoogleDriveSyncProps {
  library: Book[];
  readingGoal: number;
  onRestore: (restoredLibrary: Book[], restoredGoal: number) => void;
}

export default function GoogleDriveSync({ library, readingGoal, onRestore }: GoogleDriveSyncProps) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const [clientIdConfigured, setClientIdConfigured] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  const [showConfigGuide, setShowConfigGuide] = useState(false);
  const [copiedDev, setCopiedDev] = useState(false);
  const [copiedProd, setCopiedProd] = useState(false);

  // Dynamic URLs
  const devCallbackUrl = `${window.location.origin}/auth/callback`;
  const prodCallbackUrl = `${window.location.origin}/auth/callback/`;

  // Fetch configurations on mount to see if Google Client ID is configured
  useEffect(() => {
    checkAuthConfig();
  }, []);

  const checkAuthConfig = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      if (res.ok) {
        const data = await res.json();
        setClientIdConfigured(data.clientIdConfigured);
      }
    } catch (e) {
      console.error('Failed to verify auth config', e);
    }
  };

  // Listen for postMessage from the popup window
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      // Allow only current origin
      if (origin !== window.location.origin) return;

      if (event.data?.type === 'GOOGLE_OAUTH_SUCCESS') {
        const token = event.data.token;
        setAccessToken(token);
        setIsConnecting(false);
        setSyncStatus('success');
        setStatusMessage('Connected to Google Drive.');
        // Store log in session (safe fallback)
        sessionStorage.setItem('gd_connected', 'true');
      } else if (event.data?.type === 'GOOGLE_OAUTH_ERROR') {
        const err = event.data.error;
        console.error('OAuth Error:', err);
        setAccessToken(null);
        setIsConnecting(false);
        setSyncStatus('error');
        setStatusMessage(`Authentication failed: ${err}`);
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  // Check if previously connected in this session (token can be fetched or requested again)
  const handleConnect = async () => {
    setIsConnecting(true);
    setSyncStatus('idle');
    setStatusMessage('');

    try {
      const response = await fetch('/api/auth/google/url');
      if (!response.ok) {
        throw new Error('Failed to fetch auth configuration from server.');
      }
      const data = await response.json();
      
      if (!data.clientIdConfigured) {
        setClientIdConfigured(false);
        setIsConnecting(false);
        setShowConfigGuide(true);
        setSyncStatus('error');
        setStatusMessage('Google Client ID is not configured on the server.');
        return;
      }

      setClientIdConfigured(true);

      // Open OAuth provider directly in popup
      const authWindow = window.open(
        data.url,
        'google_oauth_popup',
        'width=600,height=700,status=no,resizable=yes,scrollbars=yes'
      );

      if (!authWindow) {
        setIsConnecting(false);
        alert('Popup blocked! Please allow popups for this application to log in with Google.');
        setSyncStatus('error');
        setStatusMessage('Popup was blocked by your browser.');
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      setIsConnecting(false);
      setSyncStatus('error');
      setStatusMessage(error.message || 'Error initializing connection.');
    }
  };

  const handleDisconnect = () => {
    setAccessToken(null);
    sessionStorage.removeItem('gd_connected');
    setSyncStatus('idle');
    setStatusMessage('Logged out from Google.');
  };

  // Google Drive File Operations Helper (Find existing backup file)
  const findBackupFile = async (token: string): Promise<string | null> => {
    const query = encodeURIComponent("name = 'with_book_library_backup.json' and trashed = false");
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      if (res.status === 401) {
        handleDisconnect();
        throw new Error('Google session expired. Please reconnect.');
      }
      throw new Error('Failed to query files in Google Drive.');
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  };

  // 1. Back up reading logs to Google Drive
  const handleBackup = async () => {
    if (!accessToken) return;
    setIsBackingUp(true);
    setSyncStatus('idle');
    setStatusMessage('Preparing backup payload...');

    try {
      const backupPayload = {
        app: 'WITH BOOK Reading Journal',
        timestamp: new Date().toISOString(),
        readingGoal: readingGoal,
        library: library
      };

      const fileId = await findBackupFile(accessToken);

      if (fileId) {
        // Confirmation before overwriting existing file
        const confirmed = window.confirm('An existing backup file was found on Google Drive. Overwrite it with your current library logs?');
        if (!confirmed) {
          setIsBackingUp(false);
          setStatusMessage('Backup cancelled by user.');
          return;
        }

        setStatusMessage('Updating backup file...');
        const updateRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(backupPayload)
        });

        if (!updateRes.ok) throw new Error('Failed to update the backup file.');
      } else {
        setStatusMessage('Creating a new backup file...');
        // Create new file with metadata & media content using multipart/related
        const boundary = 'withbook_multipart_boundary';
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;

        const metadata = {
          name: 'with_book_library_backup.json',
          mimeType: 'application/json',
          description: 'Library database backup for WITH BOOK reading companion'
        };

        const body = 
          delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          JSON.stringify(backupPayload) +
          closeDelimiter;

        const createRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`
          },
          body: body
        });

        if (!createRes.ok) throw new Error('Failed to create the backup file.');
      }

      setSyncStatus('success');
      setStatusMessage(`Library backed up successfully at ${new Date().toLocaleTimeString()}!`);
    } catch (e: any) {
      console.error(e);
      setSyncStatus('error');
      setStatusMessage(e.message || 'Error occurred during backup.');
    } finally {
      setIsBackingUp(false);
    }
  };

  // 2. Restore reading logs from Google Drive
  const handleRestore = async () => {
    if (!accessToken) return;
    setIsRestoring(true);
    setSyncStatus('idle');
    setStatusMessage('Searching for backup file...');

    try {
      const fileId = await findBackupFile(accessToken);

      if (!fileId) {
        setSyncStatus('error');
        setStatusMessage('No backup file (with_book_library_backup.json) found on your Google Drive.');
        setIsRestoring(false);
        return;
      }

      setStatusMessage('Fetching backup content...');
      const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!downloadRes.ok) throw new Error('Failed to download backup file content.');

      const backupData = await downloadRes.json();
      
      if (!backupData.library || !Array.isArray(backupData.library)) {
        throw new Error('Backup content format is invalid (missing library logs).');
      }

      const restoredLibrary: Book[] = backupData.library;
      const restoredGoal: number = backupData.readingGoal || 12;

      // Ask how user wants to handle restore
      const option = window.confirm(
        `Backup file found!\n- Saved on: ${new Date(backupData.timestamp).toLocaleString()}\n- Books count: ${restoredLibrary.length}\n- Annual Goal: ${restoredGoal}\n\nClick OK to OVERWRITE your current local library entirely.\nClick Cancel to MERGE the backup books into your existing library.`
      );

      if (option) {
        // Overwrite Entirely
        onRestore(restoredLibrary, restoredGoal);
        setSyncStatus('success');
        setStatusMessage('Library completely restored and overwritten from Google Drive.');
      } else {
        // Merge with current library logs
        // Deduplicate by combining list. Matches books based on title and author
        const merged: Book[] = [...library];
        let addedCount = 0;
        
        restoredLibrary.forEach((b) => {
          const exists = merged.some(
            (curr) => curr.title.toLowerCase() === b.title.toLowerCase() && curr.author.toLowerCase() === b.author.toLowerCase()
          );
          if (!exists) {
            merged.push(b);
            addedCount++;
          }
        });

        const mergedGoal = Math.max(readingGoal, restoredGoal);
        onRestore(merged, mergedGoal);
        setSyncStatus('success');
        setStatusMessage(`Merged ${addedCount} new books from backup file! Current library has ${merged.length} books.`);
      }
    } catch (e: any) {
      console.error(e);
      setSyncStatus('error');
      setStatusMessage(e.message || 'Error occurred during restore.');
    } finally {
      setIsRestoring(false);
    }
  };

  // 3. Export full reading log as a beautiful Markdown file to Google Drive
  const handleExportJournal = async () => {
    if (!accessToken) return;
    setIsExporting(true);
    setSyncStatus('idle');
    setStatusMessage('Generating Markdown journal...');

    try {
      // Build reading statistics and books content
      const completedList = library.filter((b) => b.status === 'completed');
      const readingList = library.filter((b) => b.status === 'reading');
      const wishlistList = library.filter((b) => b.status === 'to-read');
      
      let markdown = `# WITH BOOK — Reading Journal Log\n`;
      markdown += `*Generated on: ${new Date().toLocaleString()}*\n\n`;
      markdown += `## 📊 My Reading Dashboard\n`;
      markdown += `- **Logged Books**: ${library.length}\n`;
      markdown += `- **Completed**: ${completedList.length} / ${readingGoal} annual target (${Math.min(100, Math.round((completedList.length / readingGoal) * 100))}%)\n`;
      markdown += `- **Active Reads**: ${readingList.length}\n`;
      markdown += `- **Wishlist (To Read)**: ${wishlistList.length}\n\n`;
      markdown += `---\n\n`;

      markdown += `## 📖 Logged Book Details\n\n`;

      if (library.length === 0) {
        markdown += `*No books currently logged in your library.*`;
      } else {
        library.forEach((book, idx) => {
          markdown += `### ${idx + 1}. ${book.title}\n`;
          markdown += `- **Author**: ${book.author}\n`;
          markdown += `- **Genre**: ${book.genre}\n`;
          markdown += `- **Status**: ${book.status === 'completed' ? '✅ Completed' : book.status === 'reading' ? '📖 Currently Reading' : '⏳ To Read'}\n`;
          if (book.rating > 0) {
            markdown += `- **My Rating**: ${'★'.repeat(book.rating)}${'☆'.repeat(5 - book.rating)} (${book.rating}/5)\n`;
          }
          if (book.isbn) {
            markdown += `- **ISBN-13**: ${book.isbn}\n`;
          }
          if (book.dateStarted) {
            markdown += `- **Date Started**: ${book.dateStarted}\n`;
          }
          if (book.dateCompleted) {
            markdown += `- **Date Completed**: ${book.dateCompleted}\n`;
          }
          
          markdown += `\n**📔 Reflections & Personal Journal Notes:**\n`;
          markdown += `> ${book.userNotes || '*No reflections recorded yet.*'}\n\n`;

          if (book.keyQuotes && book.keyQuotes.length > 0) {
            markdown += `**🖋️ Striking Quotes & Passages:**\n`;
            book.keyQuotes.forEach((quote) => {
              markdown += `* "${quote}"\n`;
            });
            markdown += `\n`;
          }
          markdown += `---\n\n`;
        });
      }

      setStatusMessage('Uploading Markdown document...');
      const fileName = `WithBook_Reading_Journal_${new Date().toISOString().split('T')[0]}.md`;

      const boundary = 'withbook_markdown_boundary';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const metadata = {
        name: fileName,
        mimeType: 'text/markdown',
        description: 'Formatted markdown journal generated from WITH BOOK app'
      };

      const body = 
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: text/markdown; charset=UTF-8\r\n\r\n' +
        markdown +
        closeDelimiter;

      const exportRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: body
      });

      if (!exportRes.ok) throw new Error('Failed to upload the Markdown file.');

      setSyncStatus('success');
      setStatusMessage(`Successfully exported your reading journal to Google Drive as "${fileName}"!`);
    } catch (e: any) {
      console.error(e);
      setSyncStatus('error');
      setStatusMessage(e.message || 'Error occurred during journal export.');
    } finally {
      setIsExporting(false);
    }
  };

  // 4. Download local backup file to PC (Manual fallback)
  const handleLocalDownload = () => {
    try {
      const backupPayload = {
        app: 'WITH BOOK Reading Journal',
        timestamp: new Date().toISOString(),
        readingGoal: readingGoal,
        library: library
      };
      
      const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `with_book_library_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSyncStatus('success');
      setStatusMessage('Local backup file downloaded to your PC successfully!');
    } catch (e: any) {
      console.error(e);
      setSyncStatus('error');
      setStatusMessage('Failed to download local backup file.');
    }
  };

  // 5. Restore from local backup file uploaded from PC (Manual fallback)
  const handleLocalUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const backupData = JSON.parse(content);

        if (!backupData.library || !Array.isArray(backupData.library)) {
          throw new Error('Invalid backup file format.');
        }

        const restoredLibrary: Book[] = backupData.library;
        const restoredGoal: number = backupData.readingGoal || 12;

        const option = window.confirm(
          `Local backup file loaded!\n- Saved on: ${backupData.timestamp ? new Date(backupData.timestamp).toLocaleString() : 'Unknown date'}\n- Books count: ${restoredLibrary.length}\n- Annual Goal: ${restoredGoal}\n\nClick OK to OVERWRITE your current local library entirely.\nClick Cancel to MERGE the backup books into your existing library.`
        );

        if (option) {
          onRestore(restoredLibrary, restoredGoal);
          setSyncStatus('success');
          setStatusMessage('Library completely restored from local file backup.');
        } else {
          const merged: Book[] = [...library];
          let addedCount = 0;
          
          restoredLibrary.forEach((b) => {
            const exists = merged.some(
              (curr) => curr.title.toLowerCase() === b.title.toLowerCase() && curr.author.toLowerCase() === b.author.toLowerCase()
            );
            if (!exists) {
              merged.push(b);
              addedCount++;
            }
          });

          const mergedGoal = Math.max(readingGoal, restoredGoal);
          onRestore(merged, mergedGoal);
          setSyncStatus('success');
          setStatusMessage(`Merged ${addedCount} new books from local backup! Current library has ${merged.length} books.`);
        }
      } catch (err: any) {
        console.error(err);
        setSyncStatus('error');
        setStatusMessage('Failed to parse backup file. Please ensure it is a valid WITH BOOK JSON backup file.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const copyToClipboard = (text: string, isProd: boolean) => {
    navigator.clipboard.writeText(text);
    if (isProd) {
      setCopiedProd(true);
      setTimeout(() => setCopiedProd(false), 2000);
    } else {
      setCopiedDev(true);
      setTimeout(() => setCopiedDev(false), 2000);
    }
  };

  return (
    <div className="bg-[#0F1115] rounded-xl border border-[#212429] shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Cloud className={`w-5 h-5 ${accessToken ? 'text-emerald-400 animate-pulse' : 'text-amber-500'}`} />
          <h3 className="font-serif font-semibold text-lg tracking-tight text-white">
            Google Drive Backup
          </h3>
        </div>
        {accessToken && (
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-1.5 text-[10px] text-stone-400 hover:text-red-400 font-mono transition-colors"
            title="Log Out from Google"
          >
            <LogOut className="w-3.5 h-3.5" />
            DISCONNECT
          </button>
        )}
      </div>

      {!accessToken ? (
        <div className="space-y-4">
          <p className="text-xs text-[#9CA3AF] leading-relaxed font-sans">
            Securely save your reading history, notes, quotes, and annual goals. Restoring merges or replaces your local logs anytime, anywhere.
          </p>

          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black text-xs font-bold py-2.5 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Connecting to Google...
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4" />
                Sign in with Google Drive
              </>
            )}
          </button>

          {/* Setup Instructions Toggle Banner */}
          <div className="pt-2 border-t border-[#212429]">
            <button
              onClick={() => setShowConfigGuide(!showConfigGuide)}
              className="w-full flex items-center justify-between text-left text-xs font-mono text-stone-400 hover:text-white"
            >
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500/70" />
                {!clientIdConfigured ? '⚠️ Setup Required' : 'OAuth Configuration Guide'}
              </span>
              {showConfigGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showConfigGuide && (
              <div className="mt-3 bg-[#16191F] border border-[#212429] p-4 rounded-lg space-y-3 text-[11px] text-[#9CA3AF] leading-normal">
                <p className="font-semibold text-white">Instructions to connect Google Drive:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to Google Cloud Credentials: <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline inline-flex items-center gap-0.5">Console <ExternalLink className="w-2.5 h-2.5" /></a></li>
                  <li>Create an <strong>OAuth 2.0 Client ID</strong> (select <strong>Web application</strong>).</li>
                  <li>Configure Authorized redirect URIs:</li>
                </ol>

                <div className="space-y-2 pt-1 font-mono text-[10px]">
                  <div className="bg-[#0F1115] p-2 rounded border border-[#212429] relative group">
                    <span className="text-[#6B7280] block text-[8px] uppercase">DEVELOPMENT CALLBACK</span>
                    <span className="text-stone-300 break-all pr-8 block">{devCallbackUrl}</span>
                    <button 
                      onClick={() => copyToClipboard(devCallbackUrl, false)} 
                      className="absolute right-2 top-2 p-1 text-[#6B7280] hover:text-white transition-colors"
                    >
                      {copiedDev ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="bg-[#0F1115] p-2 rounded border border-[#212429] relative group">
                    <span className="text-[#6B7280] block text-[8px] uppercase">SHARED/DEPLOYED CALLBACK</span>
                    <span className="text-stone-300 break-all pr-8 block">{prodCallbackUrl}</span>
                    <button 
                      onClick={() => copyToClipboard(prodCallbackUrl, true)} 
                      className="absolute right-2 top-2 p-1 text-[#6B7280] hover:text-white transition-colors"
                    >
                      {copiedProd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <p className="text-stone-400">
                  4. Set the <strong>GOOGLE_CLIENT_ID</strong> environment variable to your Client ID in AI Studio settings, then restart the server.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg flex items-center gap-2.5">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs text-emerald-300 font-sans">
              Google authentication active. Ready to sync.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={handleBackup}
              disabled={isBackingUp || isRestoring || isExporting}
              className="bg-[#16191F] hover:bg-[#212429] border border-[#212429] hover:border-amber-500/30 text-white disabled:opacity-50 text-xs py-2.5 px-2 rounded-lg font-medium transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm"
              title="Save logs to Google Drive"
            >
              <Upload className={`w-4 h-4 text-amber-500 ${isBackingUp ? 'animate-bounce' : ''}`} />
              Backup Now
            </button>

            <button
              onClick={handleRestore}
              disabled={isBackingUp || isRestoring || isExporting}
              className="bg-[#16191F] hover:bg-[#212429] border border-[#212429] hover:border-emerald-500/30 text-white disabled:opacity-50 text-xs py-2.5 px-2 rounded-lg font-medium transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm"
              title="Load logs from Google Drive"
            >
              <Download className={`w-4 h-4 text-emerald-400 ${isRestoring ? 'animate-bounce' : ''}`} />
              Restore Logs
            </button>

            <button
              onClick={handleExportJournal}
              disabled={isBackingUp || isRestoring || isExporting}
              className="bg-[#16191F] hover:bg-[#212429] border border-[#212429] hover:border-sky-500/30 text-white disabled:opacity-50 text-xs py-2.5 px-2 rounded-lg font-medium transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm"
              title="Export reading logs as beautifully formatted Markdown document"
            >
              <FileText className={`w-4 h-4 text-sky-400 ${isExporting ? 'animate-pulse' : ''}`} />
              Export MD
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Status and Error Banner */}
      {syncStatus !== 'idle' && (
        <div className={`mt-4 p-3 rounded-lg text-xs leading-normal flex items-start gap-2.5 font-sans animate-fade-in
          ${syncStatus === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' 
            : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
          }`}
        >
          {syncStatus === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Offline Manual Backup & Restore Section */}
      <div className="mt-5 pt-4 border-t border-[#212429]">
        <div className="flex items-center gap-2 mb-2">
          <CloudLightning className="w-4 h-4 text-amber-500" />
          <h4 className="text-[11px] font-mono tracking-wider text-white uppercase font-bold">
            Offline Manual File Backup & Sync
          </h4>
        </div>
        <p className="text-[11px] text-[#9CA3AF] leading-relaxed mb-3">
          Your book log and notes are <strong>automatically saved</strong> to your local browser storage, so they are perfectly safe even if you turn off or restart your PC. For maximum peace of mind, you can save a manual backup file directly to your PC, or load previous logs anytime.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={handleLocalDownload}
            className="bg-[#16191F] hover:bg-[#212429] border border-[#212429] hover:border-amber-500/30 text-white text-xs py-2 px-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm"
            title="Download manual JSON backup file to your computer"
          >
            <Download className="w-3.5 h-3.5 text-amber-500" />
            Download Backup File
          </button>

          <label
            className="bg-[#16191F] hover:bg-[#212429] border border-[#212429] hover:border-emerald-500/30 text-white text-xs py-2 px-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            title="Load manual JSON backup file from your computer"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            Load Backup File
            <input
              type="file"
              accept=".json"
              onChange={handleLocalUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
