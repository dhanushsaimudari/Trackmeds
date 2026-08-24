import React from 'react';
import { Layout } from './components/layout/Layout';
import { OverviewPage } from './pages/OverviewPage';
import { InventoryPage } from './pages/InventoryPage';
import { ForecastsPage } from './pages/ForecastsPage';
import { RedistributionPage } from './pages/RedistributionPage';
import { ScenarioPage } from './pages/ScenarioPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { InsightsPage } from './pages/InsightsPage';

export const App: React.FC = () => {
  return (
    <Layout>
      {({ country, region, activeTab, setActiveTab, onOpenCopilot, refreshTrigger }) => {
        switch (activeTab) {
          case 'overview':
            return (
              <OverviewPage
                country={country}
                region={region}
                onNavigateTab={(t) => setActiveTab(t)}
                onOpenCopilot={onOpenCopilot}
                refreshTrigger={refreshTrigger}
              />
            );
          case 'inventory':
            return <InventoryPage country={country} region={region} />;
          case 'forecasts':
            return <ForecastsPage country={country} />;
          case 'redistribution':
            return <RedistributionPage country={country} />;
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
                onNavigateTab={(t) => setActiveTab(t)}
                onOpenCopilot={onOpenCopilot}
                refreshTrigger={refreshTrigger}
              />
            );
        }
      }}
    </Layout>
  );
};

export default App;
