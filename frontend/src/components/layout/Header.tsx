import React, { useState, useEffect } from 'react';
import { Country, UserRole, Language, NotificationItem } from '../../types';
import { getTranslation } from '../../utils/i18n';
import { api } from '../../services/api';
import {
  Globe,
  Shield,
  Bell,
  Flame,
  RotateCcw,
  Languages,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';

interface HeaderProps {
  country: Country;
  setCountry: (c: Country) => void;
  region: string;
  setRegion: (r: string) => void;
  role: UserRole;
  setRole: (r: UserRole) => void;
  lang: Language;
  setLang: (l: Language) => void;
  onRefreshData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  country,
  setCountry,
  region,
  setRegion,
  role,
  setRole,
  lang,
  setLang,
  onRefreshData
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  const handleLoadDemo = async () => {
    setIsLoadingDemo(true);
    try {
      await api.loadEmergencyDemoScenario();
      await fetchNotifications();
      onRefreshData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const handleResetDemo = async () => {
    try {
      await api.resetDemoDatabase();
      await fetchNotifications();
      onRefreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter(n => !n.read_status).length;

  // Region mapping per BRICS country
  const regionMap: Record<string, string[]> = {
    'India': ['Maharashtra', 'Kerala', 'Gujarat', 'Delhi NCR'],
    'China': ['Guangdong', 'Hubei', 'Sichuan', 'Shanghai'],
    'South Africa': ['Gauteng', 'Western Cape', 'KwaZulu-Natal'],
    'Brazil': ['São Paulo', 'Rio de Janeiro', 'Minas Gerais'],
    'Russia': ['Moscow Oblast', 'Saint Petersburg', 'Novosibirsk Oblast'],
    'All': [
      'Maharashtra', 'Kerala', 'Gujarat', 'Delhi NCR',
      'Guangdong', 'Hubei', 'Sichuan', 'Shanghai',
      'Gauteng', 'Western Cape', 'KwaZulu-Natal',
      'São Paulo', 'Rio de Janeiro', 'Minas Gerais',
      'Moscow Oblast', 'Saint Petersburg', 'Novosibirsk Oblast'
    ]
  };

  const availableRegions = regionMap[country] || regionMap['All'];

  const handleCountryChange = (newCountry: Country) => {
    setCountry(newCountry);
    setRegion('All'); // Reset region filter to All when country changes
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
      {/* Title & Subtitle */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold tracking-tight text-white">{getTranslation(lang, 'appTitle')}</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-500/20 text-brand-400 border border-brand-500/30">
              BRICS Track 3
            </span>
          </div>
          <p className="text-xs text-slate-400">{getTranslation(lang, 'appSubtitle')}</p>
        </div>
      </div>

      {/* Action Controls & Selectors */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Country Selector */}
        <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs">
          <Globe className="w-3.5 h-3.5 text-brand-400" />
          <select
            value={country}
            onChange={(e) => handleCountryChange(e.target.value as Country)}
            className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
          >
            <option value="India" className="bg-slate-900 text-slate-200">🇮🇳 India</option>
            <option value="China" className="bg-slate-900 text-slate-200">🇨🇳 China</option>
            <option value="South Africa" className="bg-slate-900 text-slate-200">🇿🇦 South Africa</option>
            <option value="Brazil" className="bg-slate-900 text-slate-200">🇧🇷 Brazil</option>
            <option value="Russia" className="bg-slate-900 text-slate-200">🇷🇺 Russia</option>
            <option value="All" className="bg-slate-900 text-slate-200">🌐 BRICS (All 5)</option>
          </select>
        </div>

        {/* Dynamic Region Filter per Selected Country */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
          >
            <option value="All" className="bg-slate-900">All Regions ({country})</option>
            {availableRegions.map((r) => (
              <option key={r} value={r} className="bg-slate-900">{r}</option>
            ))}
          </select>
        </div>

        {/* Role Switcher */}
        <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs">
          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
          >
            <option value="National Admin" className="bg-slate-900">National Admin</option>
            <option value="District Officer" className="bg-slate-900">District Officer</option>
            <option value="PHC Manager" className="bg-slate-900">PHC Manager</option>
          </select>
        </div>

        {/* Language Toggle */}
        <button
          onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
          className="flex items-center space-x-1.5 bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 transition-colors"
          title="Toggle Multilingual (English / Hindi)"
        >
          <Languages className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold uppercase">{lang}</span>
        </button>

        {/* Emergency Demo Button */}
        <button
          onClick={handleLoadDemo}
          disabled={isLoadingDemo}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-medium text-xs rounded-lg px-3 py-1.5 shadow-md shadow-rose-900/30 transition-all active:scale-95 disabled:opacity-50"
        >
          <Flame className="w-3.5 h-3.5 animate-pulse text-amber-200" />
          <span>{isLoadingDemo ? 'Loading Scenario...' : getTranslation(lang, 'demoScenarioBtn')}</span>
        </button>

        {/* Reset Demo DB */}
        <button
          onClick={handleResetDemo}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 transition-colors"
          title={getTranslation(lang, 'resetDemoBtn')}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Notifications Icon & Badge */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDrawer(!showNotifDrawer)}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Drawer Dropdown */}
          {showNotifDrawer && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-panel p-4 shadow-2xl border border-slate-700 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-brand-400" />
                  <h3 className="text-sm font-semibold text-white">System Alerts</h3>
                </div>
                <button
                  onClick={() => setShowNotifDrawer(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-3 space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No active system alerts.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-lg border text-xs ${n.severity === 'critical'
                          ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                          : n.severity === 'warning'
                            ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                            : 'bg-slate-800/60 border-slate-700 text-slate-300'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="font-bold">{n.title}</span>
                        <span className="text-[10px] opacity-70 whitespace-nowrap">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] opacity-90 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
