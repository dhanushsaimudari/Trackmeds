import React, { useState, useEffect } from 'react';
import { Country, UserRole, Language, NotificationItem } from '../../types';
import { getTranslation } from '../../utils/i18n';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { TrackMedsLogo } from '../common/TrackMedsLogo';
import { ALL_INDIA_STATES } from '../../services/indiaGeoData';
import {
  Bell,
  Flame,
  RotateCcw,
  Languages,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Sun,
  Moon,
  Menu,
  MapPin,
  Radio,
  Building2,
  ChevronDown,
  UserPlus,
  LogOut,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  country: Country;
  setCountry: (c: Country) => void;
  selectedState: string;
  setSelectedState: (s: string) => void;
  selectedDistrict: string;
  setSelectedDistrict: (d: string) => void;
  role: UserRole;
  setRole: (r: UserRole) => void;
  lang: Language;
  setLang: (l: Language) => void;
  onRefreshData: () => void;
  onOpenSOSModal: () => void;
  onToggleMobileNav?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  country,
  setCountry,
  selectedState,
  setSelectedState,
  selectedDistrict,
  setSelectedDistrict,
  role,
  setRole,
  lang,
  setLang,
  onRefreshData,
  onOpenSOSModal,
  onToggleMobileNav
}) => {
  const { currentRole, switchDemoAccount, currentUser, isLoading: isRoleSwitching, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();

    const handleOutsideClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
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

  useEffect(() => {
    if (currentUser) {
      if (currentUser.state) {
        setSelectedState(currentUser.state);
      }
      if (currentUser.district) {
        setSelectedDistrict(currentUser.district);
      }
    }
  }, [currentUser]);

  const handleStateChange = (newState: string) => {
    setSelectedState(newState);
    setSelectedDistrict('All');
    onRefreshData();
  };

  const handleDistrictChange = (newDistrict: string) => {
    setSelectedDistrict(newDistrict);
    onRefreshData();
  };

  const unreadCount = notifications.filter(n => !n.read_status).length;

  // Active state object for district options
  const activeStateObj = ALL_INDIA_STATES.find(
    s => s.name.toLowerCase() === selectedState.toLowerCase()
  );
  const availableDistricts = activeStateObj ? activeStateObj.districts : [];

  const getScopeBadge = () => {
    if (currentRole === 'NATIONAL_ADMIN') {
      return (
        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center space-x-1.5 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>ALL INDIA NETWORK</span>
        </span>
      );
    }
    if (currentRole === 'STATE_OFFICER') {
      return (
        <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
          STATE: {selectedState}
        </span>
      );
    }
    if (currentRole === 'DISTRICT_OFFICER') {
      return (
        <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
          DISTRICT: {selectedDistrict !== 'All' ? selectedDistrict : 'Pune'}
        </span>
      );
    }
    if (currentRole === 'PHC_STAFF') {
      return (
        <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
          CLINIC: Haveli PHC
        </span>
      );
    }
    return null;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2.5 transition-colors shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2.5 max-w-7xl mx-auto">
        
        {/* Left Section: Brand Logo & Scope Badge */}
        <div className="flex items-center space-x-3">
          {onToggleMobileNav && (
            <button
              onClick={onToggleMobileNav}
              className="p-1.5 rounded-lg md:hidden text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <TrackMedsLogo variant="full" />

          <div className="hidden lg:flex items-center pl-1">
            {getScopeBadge()}
          </div>
        </div>

        {/* Right Section: Location Selectors & Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 ml-auto">
          
          {/* 1. Unified Jurisdiction Selector Pill */}
          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
            <MapPin className="w-3.5 h-3.5 text-[#006CD4] shrink-0" />
            <select
              value={selectedState}
              disabled={currentRole === 'STATE_OFFICER' || currentRole === 'DISTRICT_OFFICER' || currentRole === 'PHC_STAFF'}
              onChange={(e) => handleStateChange(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-slate-100 font-bold focus:outline-none cursor-pointer text-xs max-w-[110px] sm:max-w-[140px] truncate"
            >
              <option value="All" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                All India
              </option>
              {ALL_INDIA_STATES.map((s) => (
                <option key={s.code} value={s.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {s.name}
                </option>
              ))}
            </select>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <select
              value={selectedDistrict}
              disabled={selectedState === 'All' || currentRole === 'DISTRICT_OFFICER' || currentRole === 'PHC_STAFF'}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-300 font-semibold focus:outline-none cursor-pointer text-xs max-w-[100px] sm:max-w-[130px] truncate disabled:opacity-50"
            >
              <option value="All" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                {selectedState === 'All' ? 'All Districts' : `All in ${selectedState}`}
              </option>
              {availableDistricts.map((d) => (
                <option key={d.name} value={d.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. User Profile Dropdown Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(prev => !prev)}
              className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs shadow-xs transition-all cursor-pointer select-none"
              title="User Account & Role Menu"
              aria-haspopup="true"
              aria-expanded={isUserMenuOpen}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                currentRole === 'NATIONAL_ADMIN' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40' :
                currentRole === 'STATE_OFFICER' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/40' :
                currentRole === 'DISTRICT_OFFICER' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40' :
                currentRole === 'PHC_STAFF' ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/40' :
                'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/40'
              }`}>
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 max-w-[80px] sm:max-w-[120px] truncate leading-tight">
                  {currentUser?.name || currentUser?.email || 'User'}
                </span>
                <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                  {currentRole.replace('_', ' ')}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu Container */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in space-y-2">
                {/* Profile Overview Card */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {currentUser?.name || 'Verified Healthcare User'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {currentUser?.email}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Jurisdiction:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {currentUser?.state || selectedState} • {currentUser?.district || selectedDistrict}
                    </span>
                  </div>
                </div>

                {/* 1-Click Role Switcher */}
                <div className="space-y-1">
                  <div className="px-2 pt-1 pb-0.5 text-[10px] font-extrabold uppercase text-slate-400 flex items-center justify-between">
                    <span>1-Click Switch Role</span>
                    <Sparkles className="w-3 h-3 text-amber-400" />
                  </div>
                  {[
                    { r: 'NATIONAL_ADMIN', label: 'National Director', color: 'bg-emerald-400' },
                    { r: 'STATE_OFFICER', label: 'State Officer', color: 'bg-blue-400' },
                    { r: 'DISTRICT_OFFICER', label: 'District Officer', color: 'bg-amber-400' },
                    { r: 'PHC_STAFF', label: 'PHC Pharmacist', color: 'bg-purple-400' },
                    { r: 'SUPPLIER', label: 'Medicine Supplier', color: 'bg-cyan-400' },
                  ].map((item) => {
                    const isActive = currentRole === item.r;
                    return (
                      <button
                        key={item.r}
                        onClick={async () => {
                          setIsUserMenuOpen(false);
                          await switchDemoAccount(item.r as UserRole);
                          setRole(item.r as UserRole);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-slate-100 dark:bg-slate-800 font-bold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${isActive ? item.color : 'bg-slate-300 dark:bg-slate-600'}`} />
                          <span className={isActive ? 'text-slate-900 dark:text-white' : ''}>{item.label}</span>
                        </div>
                        {isActive && (
                          <span className="text-[10px] font-bold text-emerald-500">Active</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-1 space-y-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      window.location.hash = '#register';
                      window.dispatchEvent(new Event('hashchange'));
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#006CD4]" />
                    <span>Register New Staff Account</span>
                  </button>

                  <button
                    onClick={async () => {
                      setIsUserMenuOpen(false);
                      await logout();
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. Emergency SOS Button */}
          <button
            onClick={onOpenSOSModal}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl px-3 py-1.5 shadow-md shadow-rose-600/20 transition-all active:scale-95 animate-pulse cursor-pointer"
            title="Request Urgent Emergency Medicines"
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Urgent SOS</span>
          </button>

          {/* 5. Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Color Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
            )}
          </button>

          {/* 6. Multilingual Language Toggle (EN / HI) */}
          <button
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 transition-colors shadow-xs"
            title="Toggle Multilingual (English / Hindi)"
          >
            <Languages className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-bold uppercase text-[11px]">{lang}</span>
          </button>

          {/* 7. System Alerts / Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDrawer(!showNotifDrawer)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors relative shadow-xs"
              aria-label="Notifications"
            >
              <Bell className="w-3.5 h-3.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-bounce shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Drawer */}
            {showNotifDrawer && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 animate-fade-in text-slate-900 dark:text-slate-100">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-[#006CD4]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">System Alerts</h3>
                  </div>
                  <button
                    onClick={() => setShowNotifDrawer(false)}
                    className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3 max-h-80 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No active system alerts</p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                          notif.severity === 'critical'
                            ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200'
                            : notif.severity === 'warning'
                            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center space-x-1.5 truncate">
                            {notif.severity === 'critical' ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            )}
                            <span className="truncate">{notif.title}</span>
                          </span>
                          <span className="text-[9px] font-mono uppercase opacity-75">{notif.severity}</span>
                        </div>
                        <p className="text-[11px] leading-relaxed opacity-90">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 8. Demo Scenario Trigger & Reset */}
          <button
            onClick={handleLoadDemo}
            disabled={isLoadingDemo}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
            title="Load Emergency Demo Outbreak Scenario"
          >
            <Flame className={`w-3.5 h-3.5 text-amber-500 ${isLoadingDemo ? 'animate-spin' : ''}`} />
          </button>
        </div>

      </div>
    </header>
  );
};
