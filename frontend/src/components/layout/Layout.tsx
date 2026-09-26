import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Country, UserRole, Language, Facility } from '../../types';
import { AICopilotModal } from '../copilot/AICopilotModal';
import { EmergencySOSModal } from '../emergency/EmergencySOSModal';
import { BackendStatusToast } from '../common/BackendStatusToast';
import { OfflineSyncBar } from '../common/OfflineSyncBar';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  LayoutDashboard,
  Boxes,
  TrendingUp,
  ArrowLeftRight,
  SlidersHorizontal,
  Truck,
  BarChart3,
  Bot,
  Radio,
  Camera,
  ShieldCheck,
  X
} from 'lucide-react';
import { getTranslation } from '../../utils/i18n';

interface LayoutProps {
  children: (props: {
    country: Country;
    region: string;
    state: string;
    district: string;
    role: UserRole;
    lang: Language;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onOpenCopilot: () => void;
    onOpenSOSModal: () => void;
    refreshTrigger: number;
    facilities: Facility[];
  }) => React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentRole } = useAuth();
  const [country, setCountry] = useState<Country>('India');
  const [selectedState, setSelectedState] = useState<string>('Maharashtra');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [role, setRole] = useState<UserRole>(currentRole);
  const [lang, setLang] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isSOSModalOpen, setIsSOSModalOpen] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const [facilities, setFacilities] = useState<Facility[]>([]);

  const handleRefreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    let isMounted = true;
    api.getFacilities(country, selectedState, selectedDistrict).then(facs => {
      if (isMounted && facs && facs.length > 0) {
        setFacilities(facs);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [country, selectedState, selectedDistrict, refreshTrigger]);

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
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Header
        country={country}
        setCountry={setCountry}
        selectedState={selectedState}
        setSelectedState={setSelectedState}
        selectedDistrict={selectedDistrict}
        setSelectedDistrict={setSelectedDistrict}
        role={role}
        setRole={setRole}
        lang={lang}
        setLang={setLang}
        onRefreshData={handleRefreshData}
        onOpenSOSModal={() => setIsSOSModalOpen(true)}
        onToggleMobileNav={() => setMobileNavOpen(true)}
      />

      {/* Offline Status Bar */}
      <OfflineSyncBar />

      {/* Mobile Drawer Navigation */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between z-10 shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="font-bold text-sm text-slate-900 dark:text-white">Menu</span>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-800 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileNavOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                        isActive
                          ? 'bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-500/40'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                <button
                  onClick={() => {
                    setMobileNavOpen(false);
                    setIsSOSModalOpen(true);
                  }}
                  className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60"
                >
                  <Radio className="w-4 h-4 animate-pulse text-rose-600 dark:text-rose-400" />
                  <span>Urgent Stock SOS</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setMobileNavOpen(false);
                setIsCopilotOpen(true);
              }}
              className="w-full py-2.5 bg-gradient-to-r from-brand-600 to-emerald-600 text-white font-semibold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2"
            >
              <Bot className="w-4 h-4" />
              <span>Ask Medicine AI</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          lang={lang}
          onOpenCopilot={() => setIsCopilotOpen(true)}
          onOpenSOSModal={() => setIsSOSModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full overflow-x-hidden">
          {children({
            country,
            region: selectedState,
            state: selectedState,
            district: selectedDistrict,
            role,
            lang,
            activeTab,
            setActiveTab,
            onOpenCopilot: () => setIsCopilotOpen(true),
            onOpenSOSModal: () => setIsSOSModalOpen(true),
            refreshTrigger,
            facilities
          })}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden sticky bottom-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around py-2 px-1">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="truncate max-w-[56px]">{item.label}</span>
            </button>
          );
        })}
      </div>

      <AICopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        country={country}
      />

      <EmergencySOSModal
        isOpen={isSOSModalOpen}
        onClose={() => setIsSOSModalOpen(false)}
        facilities={facilities}
        currentState={selectedState}
        currentDistrict={selectedDistrict}
        onSOSCreated={handleRefreshData}
      />

      <BackendStatusToast />
    </div>
  );
};
