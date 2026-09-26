import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, Wifi, X } from 'lucide-react';
import { api } from '../../services/api';

export const BackendStatusToast: React.FC = () => {
  const [status, setStatus] = useState<'fetching' | 'connected' | 'error'>('fetching');
  const [visible, setVisible] = useState(true);

  const checkConnection = async () => {
    setStatus('fetching');
    try {
      await api.pingBackendHealth();
      setStatus('connected');
      setTimeout(() => {
        setVisible(false);
      }, 4500);
    } catch (err) {
      console.warn('Backend connection pending/waking up:', err);
      setTimeout(async () => {
        try {
          await api.pingBackendHealth();
          setStatus('connected');
          setTimeout(() => setVisible(false), 4500);
        } catch {
          setStatus('error');
        }
      }, 3000);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-sm w-full">
      {status === 'fetching' && (
        <div className="bg-amber-950/90 border border-amber-500/50 backdrop-blur-md p-3.5 rounded-xl shadow-2xl flex items-start space-x-3 text-amber-100">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 mt-0.5">
            <RefreshCw className="w-4 h-4 animate-spin" />
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-200">Connecting to Network...</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">CONNECTING</span>
            </div>
            <p className="mt-1 text-[11px] text-amber-200/80 leading-relaxed">
              Starting secure connection to health database...
            </p>
          </div>
        </div>
      )}

      {status === 'connected' && (
        <div className="bg-emerald-950/90 border border-emerald-500/50 backdrop-blur-md p-3.5 rounded-xl shadow-2xl flex items-start space-x-3 text-emerald-100">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-200">Connected Successfully!</span>
              <button
                onClick={() => setVisible(false)}
                className="text-emerald-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="mt-1 text-[11px] text-emerald-200/80">
              System is online and operational.
            </p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-rose-950/90 border border-rose-500/50 backdrop-blur-md p-3.5 rounded-xl shadow-2xl flex items-start space-x-3 text-rose-100">
          <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-200">Server Starting Up...</span>
              <button
                onClick={() => setVisible(false)}
                className="text-rose-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="mt-1 text-[11px] text-rose-200/80 leading-relaxed">
              System server is initializing. Click retry to reconnect.
            </p>
            <button
              onClick={checkConnection}
              className="mt-2 px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px] flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry Connection</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
