import React, { Suspense, lazy, useState } from 'react';
import { SocProvider, useSoc } from './context/SocContext.js';
import { Header } from './components/Layout/Header.js';
import { Sidebar } from './components/Layout/Sidebar.js';
import { AttackSimulatorModal } from './components/simulator/AttackSimulatorModal.js';

const Dashboard = lazy(() => import('./pages/Dashboard.js').then((m) => ({ default: m.Dashboard })));
const VehiclesPage = lazy(() => import('./pages/Vehicles.js').then((m) => ({ default: m.VehiclesPage })));
const VehicleDetailsPage = lazy(() => import('./pages/VehicleDetails.js').then((m) => ({ default: m.VehicleDetailsPage })));
const EcusPage = lazy(() => import('./pages/Ecus.js').then((m) => ({ default: m.EcusPage })));
const CanMonitorPage = lazy(() => import('./pages/CanMonitor.js').then((m) => ({ default: m.CanMonitorPage })));
const ThreatDetectionPage = lazy(() => import('./pages/ThreatDetection.js').then((m) => ({ default: m.ThreatDetectionPage })));
const AlertsPage = lazy(() => import('./pages/Alerts.js').then((m) => ({ default: m.AlertsPage })));
const SecurityLogsPage = lazy(() => import('./pages/SecurityLogs.js').then((m) => ({ default: m.SecurityLogsPage })));
const VulnerabilitiesPage = lazy(() => import('./pages/Vulnerabilities.js').then((m) => ({ default: m.VulnerabilitiesPage })));
const IncidentsPage = lazy(() => import('./pages/Incidents.js').then((m) => ({ default: m.IncidentsPage })));
const AnalyticsPage = lazy(() => import('./pages/Analytics.js').then((m) => ({ default: m.AnalyticsPage })));
const ArchitecturePage = lazy(() => import('./pages/Architecture.js').then((m) => ({ default: m.ArchitecturePage })));
const SystemHealthPage = lazy(() => import('./pages/SystemHealth.js').then((m) => ({ default: m.SystemHealthPage })));
const SettingsPage = lazy(() => import('./pages/Settings.js').then((m) => ({ default: m.SettingsPage })));
const LoginPage = lazy(() => import('./pages/Login.js').then((m) => ({ default: m.LoginPage })));

const pageLoader = (
  <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-400">
    Loading page...
  </div>
);

function MainApp() {
  const { user } = useSoc();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  if (!isAuthenticated && !user) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const handleSelectVehicle = (id: string) => {
    setSelectedVehicleId(id);
    setCurrentTab('vehicle-details');
  };

  const handleNavigate = (tab: string, param?: string) => {
    if (tab === 'vehicle-details' && param) {
      setSelectedVehicleId(param);
    }
    setCurrentTab(tab);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={(tab) => {
            setSelectedVehicleId(null);
            setCurrentTab(tab);
          }}
          onOpenSimulator={() => setIsSimulatorOpen(true)}
        />

        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
          <Suspense fallback={pageLoader}>
            {currentTab === 'dashboard' && (
              <Dashboard
                onNavigate={handleNavigate}
                onOpenSimulator={() => setIsSimulatorOpen(true)}
              />
            )}

            {currentTab === 'vehicles' && (
              <VehiclesPage onSelectVehicle={handleSelectVehicle} />
            )}

            {currentTab === 'vehicle-details' && selectedVehicleId && (
              <VehicleDetailsPage
                vehicleId={selectedVehicleId}
                onBack={() => setCurrentTab('vehicles')}
              />
            )}

            {currentTab === 'ecus' && <EcusPage />}
            {currentTab === 'can-monitor' && <CanMonitorPage />}
            {currentTab === 'threat-detection' && <ThreatDetectionPage />}
            {currentTab === 'alerts' && <AlertsPage />}
            {currentTab === 'security-logs' && <SecurityLogsPage />}
            {currentTab === 'vulnerabilities' && <VulnerabilitiesPage />}
            {currentTab === 'incidents' && <IncidentsPage />}
            {currentTab === 'analytics' && <AnalyticsPage />}
            {currentTab === 'architecture' && <ArchitecturePage />}
            {currentTab === 'system-health' && <SystemHealthPage />}
            {currentTab === 'settings' && <SettingsPage />}
          </Suspense>
        </main>
      </div>

      <AttackSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />
    </div>
  );
}

export function App() {
  return (
    <SocProvider>
      <MainApp />
    </SocProvider>
  );
}

export default App;
