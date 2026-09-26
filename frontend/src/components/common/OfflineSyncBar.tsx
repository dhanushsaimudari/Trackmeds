import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle } from 'lucide-react';
import { pwaSyncService, QueuedMutation } from '../../services/pwaSync';

export const OfflineSyncBar: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const checkPending = async () => {
    try {
      const pending = await pwaSyncService.getPendingMutations();
      setPendingCount(pending.length);
    } catch {
      // IndexedDB not ready or error
    }
  };

  useEffect(() => {
    pwaSyncService.registerServiceWorker();

    const handleOnline = () => {
      setIsOnline(true);
      checkPending();
    };
    const handleOffline = () => {
      setIsOnline(false);
      checkPending();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    checkPending();

    const interval = setInterval(checkPending, 8000);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await pwaSyncService.flushQueue();
      await checkPending();
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={`w-full py-1.5 px-4 text-xs font-medium flex items-center justify-between transition-colors z-40 ${
      !isOnline 
        ? 'bg-amber-900/90 text-amber-200 border-b border-amber-700/50' 
        : 'bg-brand-900/90 text-brand-200 border-b border-brand-700/50'
    }`}>
      <div className="flex items-center space-x-2">
        {!isOnline ? (
          <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        ) : (
          <Wifi className="w-3.5 h-3.5 text-brand-400" />
        )}
        <span>
          {!isOnline
            ? 'Working Offline — Your stock updates are safely saved on this device'
            : `Back Online — ${pendingCount} update(s) ready to sync`}
        </span>
      </div>

      {pendingCount > 0 && isOnline && (
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="flex items-center space-x-1 px-2 py-0.5 rounded bg-brand-600 hover:bg-brand-500 text-white font-semibold text-[11px] transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>
      )}
    </div>
  );
};
