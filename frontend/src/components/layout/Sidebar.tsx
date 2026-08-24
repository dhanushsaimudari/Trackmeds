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
  Bot
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lang: Language;
  onOpenCopilot: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  lang,
  onOpenCopilot
}) => {
  const navItems = [
    { id: 'overview', label: getTranslation(lang, 'navOverview'), icon: LayoutDashboard },
    { id: 'inventory', label: getTranslation(lang, 'navInventory'), icon: Boxes },
    { id: 'forecasts', label: getTranslation(lang, 'navForecasts'), icon: TrendingUp },
    { id: 'redistribution', label: getTranslation(lang, 'navRedistribution'), icon: ArrowLeftRight },
    { id: 'scenario', label: getTranslation(lang, 'navScenario'), icon: SlidersHorizontal },
    { id: 'suppliers', label: getTranslation(lang, 'navSuppliers'), icon: Truck },
    { id: 'insights', label: getTranslation(lang, 'navInsights'), icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-61px)]">
      <div className="p-4 space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Command Operations
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-150 ${
                isActive
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30 shadow-md shadow-brand-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* AI Supply Chain Copilot Floating Card */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="glass-card p-3.5 border-brand-500/30 bg-gradient-to-br from-slate-800/90 to-brand-950/40 relative overflow-hidden">
          <div className="flex items-center space-x-2.5 mb-2">
            <div className="w-7 h-7 rounded-lg bg-brand-500/20 border border-brand-400/40 flex items-center justify-center">
              <Bot className="w-4 h-4 text-brand-400 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Gemini 3.6 Copilot</h4>
              <p className="text-[10px] text-slate-400">Grounded Supply Intelligence</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
            Ask natural language questions on stockout risks, expiry waste, or redistribution routes.
          </p>
          <button
            onClick={onOpenCopilot}
            className="w-full py-2 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-medium text-xs rounded-lg shadow-md shadow-brand-600/20 transition-all active:scale-95 flex items-center justify-center space-x-1.5"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Launch AI Assistant</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
