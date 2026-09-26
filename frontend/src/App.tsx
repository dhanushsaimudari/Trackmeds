import React from 'react';
import { Layout } from './components/layout/Layout';
import { OverviewPage } from './pages/OverviewPage';
import { InventoryPage } from './pages/InventoryPage';
import { ForecastsPage } from './pages/ForecastsPage';
import { RedistributionPage } from './pages/RedistributionPage';
import { ScenarioPage } from './pages/ScenarioPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { InsightsPage } from './pages/InsightsPage';
import { ABDMPage } from './pages/ABDMPage';
import { SmartStockIngestion } from './components/SmartStockIngestion';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPendingPage } from './pages/OnboardingPendingPage';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const { currentUser, isLoading } = useAuth();
  const [currentHash, setCurrentHash] = React.useState(() => (typeof window !== 'undefined' ? window.location.hash : ''));

  React.useEffect(() => {
    const onHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Allow explicit navigation to registration or login anytime via URL hash
  if (currentHash === '#register' || currentHash === '#signup') {
    return <AuthPage initialMode="register" />;
  }

  if (currentHash === '#login') {
    return <AuthPage initialMode="login" />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
        <p className="text-sm text-slate-400 font-medium tracking-wide">
          Verifying security credentials and access scope...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPage initialMode="register" />;
  }

  if (currentUser.approval_status === 'pending') {
    return <OnboardingPendingPage />;
  }

  return (
    <Layout>
      {({ country, region, state, district, activeTab, setActiveTab, onOpenCopilot, onOpenSOSModal, refreshTrigger }) => {
        switch (activeTab) {
          case 'overview':
            return (
              <OverviewPage
                country={country}
                region={region}
                state={state}
                district={district}
                onNavigateTab={(t) => setActiveTab(t)}
                onOpenCopilot={onOpenCopilot}
                onOpenSOSModal={onOpenSOSModal}
                refreshTrigger={refreshTrigger}
              />
            );
          case 'inventory':
            return <InventoryPage country={country} region={region} state={state} district={district} />;
          case 'forecasts':
            return <ForecastsPage country={country} state={state} district={district} />;
          case 'redistribution':
            return <RedistributionPage country={country} state={state} district={district} />;
          case 'abdm':
            return <ABDMPage country={country} state={state} district={district} />;
          case 'ingestion':
            return (
              <div className="space-y-6">
                <SmartStockIngestion onCommitSuccess={() => setActiveTab('inventory')} />
              </div>
            );
          case 'scenario':
            return <ScenarioPage country={country} />;
          case 'suppliers':
            return <SuppliersPage country={country} />;
          case 'insights':
            return <InsightsPage country={country} />;
          default:
            return (
              <OverviewPage
                country={country}
                region={region}
                state={state}
                district={district}
                onNavigateTab={(t) => setActiveTab(t)}
                onOpenCopilot={onOpenCopilot}
                onOpenSOSModal={onOpenSOSModal}
                refreshTrigger={refreshTrigger}
              />
            );
        }
      }}
    </Layout>
  );
};

export default App;

