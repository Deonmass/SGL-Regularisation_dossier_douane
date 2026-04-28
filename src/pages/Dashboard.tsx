import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import StatCard from '../components/StatCard';
import { supabase } from '../services/supabase';
import MonthlyRegulChart from '../components/MonthlyRegulChart';

interface DashboardProps {
  activeMenu?: string;
  menuTitle?: string;
}

interface RegulCapitalStats {
  totalDossiers: number;
  withManifeste: number;
  withTexoValide: number;
  withDexoValide: number;
  withIm4Bulletin: number;
  withIm4Paiement: number;
  withIm4Quittance: number;
  withIm4Bae: number;
  enCours: number;
  termines: number;
}

interface RegulProvincesStats {
  totalDossiers: number;
  withSaisieIeIc: number;
  withValidationIeIcClient: number;
  withValidationIeIcDrf: number;
  withDepotDa: number;
  withValidationDa: number;
  withRetrait: number;
  withSoumissionIm4: number;
  withBulletin: number;
  withQuittance: number;
  enCours: number;
  termines: number;
}

interface MonthlyRegulStats {
  month: string;
  completed: number;
  pending: number;
}

interface ModalState {
  isOpen: boolean;
  title: string;
  data: any[];
}

type RegionTab = 'ouest' | 'est' | 'sud';

function Dashboard({ }: DashboardProps) {
  const [regulCapitalStats, setRegulCapitalStats] = useState<RegulCapitalStats | null>(null);
  const [regulProvincesStats, setRegulProvincesStats] = useState<RegulProvincesStats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyRegulStats[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [modal, setModal] = useState<ModalState>({ isOpen: false, title: '', data: [] });
  const [activeTab, setActiveTab] = useState<RegionTab>('ouest');

  const loadRegulCapitalStats = async (region: RegionTab = 'ouest') => {
    if (region === 'ouest') {
      await loadCapitalStats();
      await loadMonthlyStats('regul_capital');
    } else {
      await loadProvincesStats();
      await loadMonthlyStats('regul_provinces');
    }
  };

  const loadCapitalStats = async () => {
    try {
      const { data: regulCapital } = await supabase
        .from('regul_capital')
        .select('*');

      if (!regulCapital) {
        setRegulCapitalStats(null);
        return;
      }

      const totalDossiers = regulCapital.length;
      const withManifeste = regulCapital.filter(d => d.date_obtention_manifeste).length;
      const withTexoValide = regulCapital.filter(d => d.texo_date_validation).length;
      const withDexoValide = regulCapital.filter(d => d.dexo_date_validation).length;
      const withIm4Bulletin = regulCapital.filter(d => d.im4_date_bulletin).length;
      const withIm4Paiement = regulCapital.filter(d => d.im4_date_paiement).length;
      const withIm4Quittance = regulCapital.filter(d => d.im4_date_quittance).length;
      const withIm4Bae = regulCapital.filter(d => d.im4_date_bae).length;
      const enCours = regulCapital.filter(d => !d.im4_date_bae).length;
      const termines = regulCapital.filter(d => d.im4_date_bae).length;

      setRegulCapitalStats({
        totalDossiers,
        withManifeste,
        withTexoValide,
        withDexoValide,
        withIm4Bulletin,
        withIm4Paiement,
        withIm4Quittance,
        withIm4Bae,
        enCours,
        termines,
      });
    } catch (err) {
      console.error('Error loading capital stats:', err);
    }
  };

  const loadProvincesStats = async () => {
    try {
      const { data: regulProvinces } = await supabase
        .from('regul_provinces')
        .select('*');

      if (!regulProvinces) {
        setRegulProvincesStats(null);
        return;
      }

      const totalDossiers = regulProvinces.length;
      const withSaisieIeIc = regulProvinces.filter(d => d.date_saisie_ie_ic).length;
      const withValidationIeIcClient = regulProvinces.filter(d => d.date_validation_ie_ic_client).length;
      const withValidationIeIcDrf = regulProvinces.filter(d => d.date_validation_ie_ic_drf).length;
      const withDepotDa = regulProvinces.filter(d => d.date_depot_da).length;
      const withValidationDa = regulProvinces.filter(d => d.date_validation_da).length;
      const withRetrait = regulProvinces.filter(d => d.date_retrait).length;
      const withSoumissionIm4 = regulProvinces.filter(d => d.date_soumission_im4).length;
      const withBulletin = regulProvinces.filter(d => d.date_bulletin).length;
      const withQuittance = regulProvinces.filter(d => d.date_quittance).length;
      const enCours = regulProvinces.filter(d => !d.date_quittance).length;
      const termines = regulProvinces.filter(d => d.date_quittance).length;

      setRegulProvincesStats({
        totalDossiers,
        withSaisieIeIc,
        withValidationIeIcClient,
        withValidationIeIcDrf,
        withDepotDa,
        withValidationDa,
        withRetrait,
        withSoumissionIm4,
        withBulletin,
        withQuittance,
        enCours,
        termines,
      });
    } catch (err) {
      console.error('Error loading provinces stats:', err);
    }
  };

  const loadMonthlyStats = async (tableName: string) => {
    setLoadingChart(true);
    try {
      const { data: regulData } = await supabase
        .from(tableName)
        .select('*');

      console.log('Monthly stats data from', tableName, regulData);

      if (!regulData) {
        setMonthlyStats([]);
        setLoadingChart(false);
        return;
      }

      // Determine the completion field based on table
      const completionField = tableName === 'regul_capital' ? 'im4_date_bae' : 'date_quittance';

      // Group by month
      const monthlyData: Record<string, MonthlyRegulStats> = regulData.reduce((acc, d: any) => {
        const date = new Date(d.created_at);
        const month = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });

        if (!acc[month]) {
          acc[month] = { month, completed: 0, pending: 0 };
        }

        // Completed if final step date is set
        if (d[completionField]) {
          acc[month].completed++;
        } else {
          acc[month].pending++;
        }

        return acc;
      }, {} as Record<string, MonthlyRegulStats>);

      // Convert to array and sort by date
      const sortedData = Object.values(monthlyData).sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });

      console.log('Monthly stats sorted data', sortedData);
      setMonthlyStats(sortedData);
    } catch (err) {
      console.error('Error loading monthly stats:', err);
    } finally {
      setLoadingChart(false);
    }
  };

  useEffect(() => {
    loadRegulCapitalStats(activeTab);
  }, [activeTab]);

  const handleRefresh = () => {
    loadRegulCapitalStats(activeTab);
  };

  const handleTabChange = (tab: RegionTab) => {
    setActiveTab(tab);
  };

  const loadDossiersByFilter = async (filterType: string) => {
    try {
      let tableName = 'regul_capital';
      if (activeTab === 'est' || activeTab === 'sud') {
        tableName = 'regul_provinces';
      }

      let query = supabase.from(tableName).select('*');
      
      if (activeTab === 'ouest') {
        switch (filterType) {
          case 'total':
            break;
          case 'withManifeste':
            query = query.not('date_obtention_manifeste', 'is', null);
            break;
          case 'withTexoValide':
            query = query.not('texo_date_validation', 'is', null);
            break;
          case 'withDexoValide':
            query = query.not('dexo_date_validation', 'is', null);
            break;
          case 'withIm4Bulletin':
            query = query.not('im4_date_bulletin', 'is', null);
            break;
          case 'withIm4Paiement':
            query = query.not('im4_date_paiement', 'is', null);
            break;
          case 'withIm4Quittance':
            query = query.not('im4_date_quittance', 'is', null);
            break;
          case 'withIm4Bae':
            query = query.not('im4_date_bae', 'is', null);
            break;
          case 'enCours':
            query = query.is('im4_date_bae', null);
            break;
          case 'termines':
            query = query.not('im4_date_bae', 'is', null);
            break;
        }
      } else {
        switch (filterType) {
          case 'total':
            break;
          case 'withSaisieIeIc':
            query = query.not('date_saisie_ie_ic', 'is', null);
            break;
          case 'withValidationIeIcClient':
            query = query.not('date_validation_ie_ic_client', 'is', null);
            break;
          case 'withValidationIeIcDrf':
            query = query.not('date_validation_ie_ic_drf', 'is', null);
            break;
          case 'withDepotDa':
            query = query.not('date_depot_da', 'is', null);
            break;
          case 'withValidationDa':
            query = query.not('date_validation_da', 'is', null);
            break;
          case 'withRetrait':
            query = query.not('date_retrait', 'is', null);
            break;
          case 'withSoumissionIm4':
            query = query.not('date_soumission_im4', 'is', null);
            break;
          case 'withBulletin':
            query = query.not('date_bulletin', 'is', null);
            break;
          case 'withQuittance':
            query = query.not('date_quittance', 'is', null);
            break;
          case 'enCours':
            query = query.is('date_quittance', null);
            break;
          case 'termines':
            query = query.not('date_quittance', 'is', null);
            break;
        }
      }
      
      const { data } = await query;
      return data || [];
    } catch (err) {
      console.error('Error loading dossiers:', err);
      return [];
    }
  };

  const openModal = async (filterType: string, title: string) => {
    const data = await loadDossiersByFilter(filterType);
    setModal({ isOpen: true, title, data });
  };

  const closeModal = () => {
    setModal({ isOpen: false, title: '', data: [] });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500">Indicateurs Régularisation</p>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm">Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => handleTabChange('ouest')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'ouest'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Ouest
            </button>
            <button
              onClick={() => handleTabChange('est')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'est'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Est
            </button>
            <button
              onClick={() => handleTabChange('sud')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'sud'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sud
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg shadow-sm p-3">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Indicateurs Régularisation {activeTab === 'ouest' ? 'Ouest' : activeTab === 'est' ? 'Est' : 'Sud'}
          </h3>
          
          {activeTab === 'ouest' ? (
            <>
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
              >
                <StatCard
                  label="Total Dossiers"
                  value={regulCapitalStats?.totalDossiers || 0}
                  currency=""
                  nombreDossiers={regulCapitalStats?.totalDossiers || 0}
                  bgColor="bg-white"
                  textColor="text-gray-900"
                  variant="default"
                  icon="calculator"
                  onHover={true}
                  borderColor="#a855f7"
                  onDetailClick={() => openModal('total', 'Total Dossiers')}
                />
                <StatCard
                  label="Avec Manifeste"
                  value={regulCapitalStats?.withManifeste || 0}
                  currency=""
                  nombreDossiers={regulCapitalStats?.withManifeste || 0}
                  bgColor="bg-white"
                  textColor="text-gray-900"
                  variant="default"
                  icon="trending"
                  onHover={true}
                  borderColor="#3b82f6"
                  onDetailClick={() => openModal('withManifeste', 'Dossiers avec Manifeste')}
                />
                <StatCard
                  label="TEXO Validé"
                  value={regulCapitalStats?.withTexoValide || 0}
                  currency=""
                  nombreDossiers={regulCapitalStats?.withTexoValide || 0}
                  bgColor="bg-white"
                  textColor="text-gray-900"
                  variant="default"
                  icon="alert"
                  onHover={true}
                  borderColor="#06b6d4"
                  onDetailClick={() => openModal('withTexoValide', 'Dossiers TEXO Validé')}
                />
                <StatCard
                  label="DEXO Validé"
                  value={regulCapitalStats?.withDexoValide || 0}
                  currency=""
                  nombreDossiers={regulCapitalStats?.withDexoValide || 0}
                  bgColor="bg-white"
                  textColor="text-gray-900"
                  variant="default"
                  icon="alert"
                  onHover={true}
                  borderColor="#14b8a6"
                  onDetailClick={() => openModal('withDexoValide', 'Dossiers DEXO Validé')}
                />
                <StatCard
                  label="IM4 Bulletin"
                  value={regulCapitalStats?.withIm4Bulletin || 0}
                  currency=""
                  nombreDossiers={regulCapitalStats?.withIm4Bulletin || 0}
                  bgColor="bg-white"
                  textColor="text-gray-900"
                  variant="default"
                  icon="trending"
                  onHover={true}
                  borderColor="#6366f1"
                  onDetailClick={() => openModal('withIm4Bulletin', 'Dossiers IM4 Bulletin')}
                />
              </div>
              <div
                className="grid gap-3 mt-4"
                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
              >
                <StatCard
                  label="IM4 Paiement"
                  value={regulCapitalStats?.withIm4Paiement || 0}
                  currency=""
                  nombreDossiers={regulCapitalStats?.withIm4Paiement || 0}
                  bgColor="bg-white"
                  textColor="text-gray-900"
                  variant="default"
                  icon="calculator"
                  onHover={true}
                  borderColor="#10b981"
                  onDetailClick={() => openModal('withIm4Paiement', 'Dossiers IM4 Paiement')}
                />
                <StatCard
                  label="IM4 Quittance"
                  value={regulCapitalStats?.withIm4Quittance || 0}
                  currency=""
                  nombreDossiers={regulCapitalStats?.withIm4Quittance || 0}
                  bgColor="bg-white"
                  textColor="text-gray-900"
                  variant="default"
                  icon="trending"
                  onHover={true}
                  borderColor="#22c55e"
                  onDetailClick={() => openModal('withIm4Quittance', 'Dossiers IM4 Quittance')}
                />
                <StatCard
                  label="IM4 BAE"
                  value={regulCapitalStats?.withIm4Bae || 0}
                  currency=""
                  nombreDossiers={regulCapitalStats?.withIm4Bae || 0}
                  bgColor="bg-white"
                  textColor="text-gray-900"
                  variant="default"
                  icon="alert"
                  onHover={true}
                  borderColor="#84cc16"
                  onDetailClick={() => openModal('withIm4Bae', 'Dossiers IM4 BAE')}
                />
                <StatCard
                  label="En Cours"
                  value={regulCapitalStats?.enCours || 0}
                  currency=""
                  nombreDossiers={regulCapitalStats?.enCours || 0}
                  bgColor="bg-white"
                  textColor="text-gray-900"
                  variant="default"
                  icon="x-circle"
                  onHover={true}
                  borderColor="#f97316"
                  onDetailClick={() => openModal('enCours', 'Dossiers En Cours')}
                />
                <StatCard
                  label="Terminés"
                  value={regulCapitalStats?.termines || 0}
                  currency=""
                  nombreDossiers={regulCapitalStats?.termines || 0}
                  bgColor="bg-white"
                  textColor="text-gray-900"
                  variant="default"
                  icon="trending"
                  onHover={true}
                  borderColor="#4ade80"
                  onDetailClick={() => openModal('termines', 'Dossiers Terminés')}
                />
              </div>
            </>
          ) : (
            <>
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
              >
                <StatCard
                  label="Total Dossiers"
                  value={regulProvincesStats?.totalDossiers || 0}
                  currency=""
                  nombreDossiers={regulProvincesStats?.totalDossiers || 0}
                  bgColor="bg-white"
                  textColor="text-gray-900"
                  variant="default"
                  icon="calculator"
                  onHover={true}
                  borderColor="#a855f7"
                  onDetailClick={() => openModal('total', 'Total Dossiers')}
                />
                <StatCard
                  label="Saisie IE/IC"
                  value={regulProvincesStats?.withSaisieIeIc || 0}
                  currency=""
                  nombreDossiers={regulProvincesStats?.withSaisieIeIc || 0}
                  bgColor="bg-white"
                  textColor="text-gray-900"
                  variant="default"
                  icon="trending"
                  onHover={true}
                  borderColor="#3b82f6"
                  onDetailClick={() => openModal('withSaisieIeIc', 'Dossiers avec Saisie IE/IC')}
                />
                <StatCard
                  label="Valid. IE/IC Client"
                  value={regulProvincesStats?.withValidationIeIcClient || 0}
                  currency=""
                  nombreDossiers={regulProvincesStats?.withValidationIeIcClient || 0}
                  bgColor="bg-white"
                  textColor="text-gray-900"
                  variant="default"
                  icon="alert"
                  onHover={true}
                  borderColor="#06b6d4"
                  onDetailClick={() => openModal('withValidationIeIcClient', 'Dossiers Valid. IE/IC Client')}
                />
                <StatCard
                  label="Valid. IE/IC DRF"
                  value={regulProvincesStats?.withValidationIeIcDrf || 0}
                  currency=""
                  nombreDossiers={regulProvincesStats?.withValidationIeIcDrf || 0}
                  bgColor="bg-white"
                  textColor="text-gray-900"
                  variant="default"
                  icon="alert"
                  onHover={true}
                  borderColor="#14b8a6"
                  onDetailClick={() => openModal('withValidationIeIcDrf', 'Dossiers Valid. IE/IC DRF')}
                />
                <StatCard
                  label="Dépôt DA"
                  value={regulProvincesStats?.withDepotDa || 0}
                  currency=""
                  nombreDossiers={regulProvincesStats?.withDepotDa || 0}
                  bgColor="bg-white"
                  textColor="text-gray-900"
                  variant="default"
                  icon="trending"
                  onHover={true}
                  borderColor="#6366f1"
                  onDetailClick={() => openModal('withDepotDa', 'Dossiers Dépôt DA')}
                />
              </div>
              <div
                className="grid gap-3 mt-4"
                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
              >
                <StatCard
                  label="Valid. DA"
                  value={regulProvincesStats?.withValidationDa || 0}
                  currency=""
                  nombreDossiers={regulProvincesStats?.withValidationDa || 0}
                  bgColor="bg-white"
                  textColor="text-gray-900"
                  variant="default"
                  icon="calculator"
                  onHover={true}
                  borderColor="#10b981"
                  onDetailClick={() => openModal('withValidationDa', 'Dossiers Valid. DA')}
                />
                <StatCard
                  label="Retrait"
                  value={regulProvincesStats?.withRetrait || 0}
                  currency=""
                  nombreDossiers={regulProvincesStats?.withRetrait || 0}
                  bgColor="bg-white"
                  textColor="text-gray-900"
                  variant="default"
                  icon="trending"
                  onHover={true}
                  borderColor="#22c55e"
                  onDetailClick={() => openModal('withRetrait', 'Dossiers Retrait')}
                />
                <StatCard
                  label="Soumission IM4"
                  value={regulProvincesStats?.withSoumissionIm4 || 0}
                  currency=""
                  nombreDossiers={regulProvincesStats?.withSoumissionIm4 || 0}
                  bgColor="bg-white"
                  textColor="text-gray-900"
                  variant="default"
                  icon="alert"
                  onHover={true}
                  borderColor="#84cc16"
                  onDetailClick={() => openModal('withSoumissionIm4', 'Dossiers Soumission IM4')}
                />
                <StatCard
                  label="Bulletin"
                  value={regulProvincesStats?.withBulletin || 0}
                  currency=""
                  nombreDossiers={regulProvincesStats?.withBulletin || 0}
                  bgColor="bg-white"
                  textColor="text-gray-900"
                  variant="default"
                  icon="x-circle"
                  onHover={true}
                  borderColor="#f97316"
                  onDetailClick={() => openModal('withBulletin', 'Dossiers Bulletin')}
                />
                <StatCard
                  label="Quittance"
                  value={regulProvincesStats?.withQuittance || 0}
                  currency=""
                  nombreDossiers={regulProvincesStats?.withQuittance || 0}
                  bgColor="bg-white"
                  textColor="text-gray-900"
                  variant="default"
                  icon="trending"
                  onHover={true}
                  borderColor="#4ade80"
                  onDetailClick={() => openModal('withQuittance', 'Dossiers Quittance')}
                />
              </div>
              <div
                className="grid gap-3 mt-4"
                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
              >
                <StatCard
                  label="En Cours"
                  value={regulProvincesStats?.enCours || 0}
                  currency=""
                  nombreDossiers={regulProvincesStats?.enCours || 0}
                  bgColor="bg-white"
                  textColor="text-gray-900"
                  variant="default"
                  icon="x-circle"
                  onHover={true}
                  borderColor="#f97316"
                  onDetailClick={() => openModal('enCours', 'Dossiers En Cours')}
                />
                <StatCard
                  label="Terminés"
                  value={regulProvincesStats?.termines || 0}
                  currency=""
                  nombreDossiers={regulProvincesStats?.termines || 0}
                  bgColor="bg-white"
                  textColor="text-gray-900"
                  variant="default"
                  icon="trending"
                  onHover={true}
                  borderColor="#4ade80"
                  onDetailClick={() => openModal('termines', 'Dossiers Terminés')}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Monthly Evolution Chart */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <MonthlyRegulChart 
          data={monthlyStats}
          loading={loadingChart}
          title={`Évolution mensuelle - ${activeTab === 'ouest' ? 'Capital' : activeTab === 'est' ? 'Goma' : 'Lubumbashi'}`}
        />
      </div>

      {/* Modal pour afficher la liste des dossiers */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">{modal.title}</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              {modal.data.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucun dossier trouvé</p>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    {activeTab === 'ouest' ? (
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Référence</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Client</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Date Manifeste</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">TEXO Validé</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">DEXO Validé</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">IM4 BAE</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Référence</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Client</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Saisie IE/IC</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Valid. IE/IC Client</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Valid. IE/IC DRF</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Dépôt DA</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Valid. DA</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Quittance</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {modal.data.map((dossier: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {activeTab === 'ouest' ? (
                          <>
                            <td className="px-4 py-2 text-sm text-gray-900">{dossier.n_dossier || '-'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{dossier.client || '-'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{dossier.date_obtention_manifeste ? new Date(dossier.date_obtention_manifeste).toLocaleDateString('fr-FR') : '-'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{dossier.texo_date_validation ? new Date(dossier.texo_date_validation).toLocaleDateString('fr-FR') : '-'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{dossier.dexo_date_validation ? new Date(dossier.dexo_date_validation).toLocaleDateString('fr-FR') : '-'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{dossier.im4_date_bae ? new Date(dossier.im4_date_bae).toLocaleDateString('fr-FR') : '-'}</td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-2 text-sm text-gray-900">{dossier.n_dossier || '-'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{dossier.client || '-'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{dossier.date_saisie_ie_ic ? new Date(dossier.date_saisie_ie_ic).toLocaleDateString('fr-FR') : '-'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{dossier.date_validation_ie_ic_client ? new Date(dossier.date_validation_ie_ic_client).toLocaleDateString('fr-FR') : '-'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{dossier.date_validation_ie_ic_drf ? new Date(dossier.date_validation_ie_ic_drf).toLocaleDateString('fr-FR') : '-'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{dossier.date_depot_da ? new Date(dossier.date_depot_da).toLocaleDateString('fr-FR') : '-'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{dossier.date_validation_da ? new Date(dossier.date_validation_da).toLocaleDateString('fr-FR') : '-'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{dossier.date_quittance ? new Date(dossier.date_quittance).toLocaleDateString('fr-FR') : '-'}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
