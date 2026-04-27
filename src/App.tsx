import { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/UsersPage';
import RegionPage from './pages/RegionPage';
import PointEntreePage from './pages/PointEntreePage';
import BureauDouanePage from './pages/BureauDouanePage';
import RegularisationPage from './pages/RegularisationPage';
import DossiersPage from './pages/DossiersPage';
import ModeTransportPage from './pages/ModeTransportPage';
import RegimeImportationPage from './pages/RegimeImportationPage';
import ClientPage from './pages/ClientPage';
import ToastContainer from './components/ToastContainer';
import { supabase } from './services/supabase';

// Menu labels mapping
const menuLabels: { [key: string]: string } = {
  dashboard: 'Dashboard',
  'dashboard-factures': 'Factures',
  'dashboard-liquidation': 'Bulletin de liquidation',
  search: 'Recherche avancée',
  'factures-new': 'Nouvelle facture',
  'factures-all': 'Factures',
  'factures-pending': 'En attente validation DR',
  'factures-pending-dop': 'En attente validation DOP',
  'factures-pending-dq': 'En attente validation DQ',
  'factures-validated': 'Validée (bon à payer)',
  'factures-paid': 'Payé',
  'factures-partially-paid': 'Partiellement payé',
  'factures-rejected': 'Rejeté',
  'factures-overdue': 'Facture Echues',
  'factures-payment-order': 'Ordres de Paiement',
  parameters: 'Paramètres',
  'parameters-suppliers': 'Fournisseurs',
  'parameters-charges': 'Types de charges',
  'parameters-agents': 'Agents',
  'parameters-centres': 'Centres de coût',
  'parameters-caisses': 'Caisses',
  'parameters-comptes': 'Comptes',
  users: 'Utilisateurs',
  regularisation: 'Régularisation',
  'regularisation-nouveau': 'Nouveau dossier',
  'regularisation-ouest': 'OUEST',
  'regularisation-est': 'EST',
  'regularisation-sud': 'SUD',
  parametres: 'Paramètres',
  'parametres-regions': 'Régions',
  'parametres-point-entree': "Point d'entrée",
  'parametres-bureau-douane': 'Bureau douane',
  'parametres-mode-transport': 'Mode de transport',
  'parametres-regime-importation': 'Régime d\'importation',
  'parametres-client': 'Client',
};

function AppContent() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [supabaseStatus, setSupabaseStatus] = useState<'loading' | 'connected' | 'error'>('loading');

  useEffect(() => {
    async function testSupabaseConnection() {
      try {
        const { error } = await supabase.from('region').select('count').limit(1);
        if (error) {
          console.error('Supabase connection error:', error);
          setSupabaseStatus('error');
        } else {
          console.log('✓ Supabase connection successful');
          setSupabaseStatus('connected');
        }
      } catch (err) {
        console.error('Supabase test error:', err);
        setSupabaseStatus('error');
      }
    }
    testSupabaseConnection();
  }, []);

  const getMenuTitle = (menu: string): string => {
    return menuLabels[menu] || menu;
  };

  const renderPage = () => {
    // Dashboard
    if (activeMenu === 'dashboard' || activeMenu === 'dashboard-factures' || activeMenu === 'dashboard-liquidation') {
      return <Dashboard activeMenu={activeMenu} menuTitle={getMenuTitle(activeMenu)} />;
    }

    // Regularisation - Nouveau dossier
    if (activeMenu === 'regularisation-nouveau') {
      return <RegularisationPage activeMenu={activeMenu} menuTitle={getMenuTitle(activeMenu)} />;
    }

    // Regularisation - OUEST
    if (activeMenu === 'regularisation-ouest') {
      return <DossiersPage activeMenu={activeMenu} menuTitle={getMenuTitle(activeMenu)} regionFilter="Ouest" />;
    }

    // Regularisation - EST
    if (activeMenu === 'regularisation-est') {
      return <DossiersPage activeMenu={activeMenu} menuTitle={getMenuTitle(activeMenu)} regionFilter="Est" />;
    }

    // Regularisation - SUD
    if (activeMenu === 'regularisation-sud') {
      return <DossiersPage activeMenu={activeMenu} menuTitle={getMenuTitle(activeMenu)} regionFilter="Sud" />;
    }

    // Regularisation
    if (activeMenu.startsWith('regularisation')) {
      return <Dashboard activeMenu={activeMenu} menuTitle={getMenuTitle(activeMenu)} />;
    }

    // Parametres - Regions
    if (activeMenu === 'parametres-regions') {
      return <RegionPage activeMenu={activeMenu} menuTitle={getMenuTitle(activeMenu)} />;
    }

    // Parametres - Point d'entrée
    if (activeMenu === 'parametres-point-entree') {
      return <PointEntreePage activeMenu={activeMenu} menuTitle={getMenuTitle(activeMenu)} />;
    }

    // Parametres - Bureau Douane
    if (activeMenu === 'parametres-bureau-douane') {
      return <BureauDouanePage activeMenu={activeMenu} menuTitle={getMenuTitle(activeMenu)} />;
    }

    // Parametres - Mode Transport
    if (activeMenu === 'parametres-mode-transport') {
      return <ModeTransportPage activeMenu={activeMenu} menuTitle={getMenuTitle(activeMenu)} />;
    }

    // Parametres - Regime Importation
    if (activeMenu === 'parametres-regime-importation') {
      return <RegimeImportationPage activeMenu={activeMenu} menuTitle={getMenuTitle(activeMenu)} />;
    }

    // Parametres - Client
    if (activeMenu === 'parametres-client') {
      return <ClientPage activeMenu={activeMenu} menuTitle={getMenuTitle(activeMenu)} />;
    }

    // Parametres
    if (activeMenu.startsWith('parametres')) {
      return <Dashboard activeMenu={activeMenu} menuTitle={getMenuTitle(activeMenu)} />;
    }

    // Users
    if (activeMenu === 'users' || activeMenu === 'parameters-agents') {
      return <UsersPage activeMenu={activeMenu} menuTitle={getMenuTitle(activeMenu)} />;
    }

    // Default
    return <Dashboard activeMenu={activeMenu} menuTitle={getMenuTitle(activeMenu)} />;
  };

  const handleMenuChange = (menu: string) => {
    setActiveMenu(menu);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar activeMenu={activeMenu} onMenuChange={handleMenuChange} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Supabase Status Indicator */}
        {renderPage()}
      </div>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default function AppWithAuth() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
