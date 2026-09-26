import React from 'react';
import { Language } from '../../types';
import { getTranslation } from '../../utils/i18n';
import {
  LayoutDashboard,
  Boxes,
  TrendingUp,
  ArrowLeftRight,
  SlidersHorizontal,
  Truck,
  BarChart3,
  Bot,
  Camera,
  Radio,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lang: Language;
  onOpenCopilot: () => void;
  onOpenSOSModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  lang,
  onOpenCopilot,
  onOpenSOSModal
}) => {
  const navItems = [
    { id: 'overview', label: getTranslation(lang, 'navOverview'), icon: LayoutDashboard },
    { id: 'ingestion', label: 'Scan Invoices (AI)', icon: Camera, badge: 'Camera' },
    { id: 'inventory', label: getTranslation(lang, 'navInventory'), icon: Boxes },
    { id: 'forecasts', label: getTranslation(lang, 'navForecasts'), icon: TrendingUp },
    { id: 'redistribution', label: getTranslation(lang, 'navRedistribution'), icon: ArrowLeftRight },
    { id: 'abdm', label: getTranslation(lang, 'navABDM'), icon: ShieldCheck, badge: 'Verified' },
    { id: 'scenario', label: getTranslation(lang, 'navScenario'), icon: SlidersHorizontal },
    { id: 'suppliers', label: getTranslation(lang, 'navSuppliers'), icon: Truck },
    { id: 'insights', label: getTranslation(lang, 'navInsights'), icon: BarChart3, badge: 'Protected' },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-65px)] transition-colors shadow-xs">
      <div className="p-4 space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Menu</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Online"></span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all duration-150 ${
                isActive
                  ? 'bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`} />
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <span className="ml-auto px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Emergency SOS Quick Button */}
        {onOpenSOSModal && (
          <button
            onClick={onOpenSOSModal}
            className="w-full mt-3 flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 shadow-xs transition-all"
          >
            <Radio className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-pulse" />
            <span>Urgent Stock SOS</span>
          </button>
        )}
      </div>

      {/* Health System Structure & AI Assistant Card */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
        {/* Healthcare Supply Structure */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400 space-y-1">
          <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300 text-[9px] uppercase tracking-widest">
            <span>Health System Levels</span>
          </div>
          <div className="flex items-center justify-between font-mono text-[9px] pt-0.5 font-bold">
            <span className="text-emerald-600 dark:text-emerald-400" title="Primary Health Center (Village Clinic)">Clinic (PHC)</span>
            <span>→</span>
            <span className="text-cyan-600 dark:text-cyan-400" title="Community Health Center">Center (CHC)</span>
            <span>→</span>
            <span className="text-amber-600 dark:text-amber-400">District</span>
            <span>→</span>
            <span className="text-blue-600 dark:text-blue-400">State</span>
            <span>→</span>
            <span className="text-brand-600 dark:text-brand-400">National</span>
          </div>
        </div>

        {/* AI Assistant Card */}
        <div className="p-3.5 rounded-xl border border-brand-200 dark:border-brand-500/30 bg-gradient-to-br from-brand-50/50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800/90 dark:to-brand-950/40 relative overflow-hidden shadow-xs">
          <div className="flex items-center space-x-2.5 mb-2">
            <div className="w-7 h-7 rounded-lg bg-brand-500/15 border border-brand-300 dark:border-brand-400/40 flex items-center justify-center">
              <Bot className="w-4 h-4 text-brand-600 dark:text-brand-400 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Smart Medicine Assistant</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Instant Medicine & Stock Help</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
            Ask questions in simple words about low medicines, expiring batches, or emergency transfers.
          </p>
          <button
            onClick={onOpenCopilot}
            className="w-full py-2 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-semibold text-xs rounded-lg shadow-md shadow-brand-600/20 transition-all active:scale-95 flex items-center justify-center space-x-1.5"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Ask Medicine AI</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
