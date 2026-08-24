import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Country, UserRole, Language } from '../../types';
import { AICopilotModal } from '../copilot/AICopilotModal';
import { BackendStatusToast } from '../common/BackendStatusToast';

interface LayoutProps {
  children: (props: {
    country: Country;
    region: string;
    role: UserRole;
    lang: Language;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onOpenCopilot: () => void;
    refreshTrigger: number;
  }) => React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [country, setCountry] = useState<Country>('India');
  const [region, setRegion] = useState<string>('All');
  const [role, setRole] = useState<UserRole>('National Admin');
  const [lang, setLang] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const handleRefreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      <Header
        country={country}
        setCountry={setCountry}
        region={region}
        setRegion={setRegion}
        role={role}
        setRole={setRole}
        lang={lang}
        setLang={setLang}
        onRefreshData={handleRefreshData}
      />

      <div className="flex flex-1">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          lang={lang}
          onOpenCopilot={() => setIsCopilotOpen(true)}
        />

        <main className="flex-1 p-6 max-w-7xl mx-auto w-full overflow-x-hidden">
          {children({
            country,
            region,
            role,
            lang,
            activeTab,
            setActiveTab,
            onOpenCopilot: () => setIsCopilotOpen(true),
            refreshTrigger
          })}
        </main>
      </div>

      <AICopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        country={country}
      />

      <BackendStatusToast />
    </div>
  );
};
