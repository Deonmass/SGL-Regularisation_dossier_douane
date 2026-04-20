import { X, Printer, Maximize2, Mail } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatCurrency } from '../utils/formatters';
import { dashboardService, type Invoice } from '../services/tableService';
import InvoiceDetailModal from './InvoiceDetailModal';
import { useAuth } from '../contexts/AuthContext';

interface Top10SuppliersModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Array<{
    fournisseur: string;
    nombreFactures: number;
    montantNonPaye: number;
  }>;
  loading?: boolean;
  year?: string;
}

function Top10SuppliersModal({
  isOpen,
  onClose,
  suppliers,
  loading = false,
  year = '2026',
}: Top10SuppliersModalProps) {
  const { agent } = useAuth();
  
  // Initialiser activeRegion basé sur la région de l'agent
  const getInitialRegion = (): 'all' | 'OUEST' | 'EST' | 'SUD' => {
    if (agent?.REGION && agent.REGION !== 'TOUT') {
      return agent.REGION as 'all' | 'OUEST' | 'EST' | 'SUD';
    }
    return 'all';
  };

  const [activeRegion, setActiveRegion] = useState<'all' | 'OUEST' | 'EST' | 'SUD'>(getInitialRegion());
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [suppliersData, setSuppliersData] = useState<typeof suppliers>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [selectedInvoices, setSelectedInvoices] = useState<Invoice[]>([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const modalRef = useRef<HTMLDivElement>(null);

  const months = [
    { value: 'all', label: 'Tous les mois' },
    { value: '01', label: 'Janvier' },
    { value: '02', label: 'Février' },
    { value: '03', label: 'Mars' },
    { value: '04', label: 'Avril' },
    { value: '05', label: 'Mai' },
    { value: '06', label: 'Juin' },
    { value: '07', label: 'Juillet' },
    { value: '08', label: 'Août' },
    { value: '09', label: 'Septembre' },
    { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Décembre' }
  ];

  const regions: Array<'all' | 'OUEST' | 'EST' | 'SUD'> = ['all', 'OUEST', 'EST', 'SUD'];
  const regionLabels: Record<'all' | 'OUEST' | 'EST' | 'SUD', string> = {
    all: 'Toutes',
    OUEST: 'Ouest',
    EST: 'Est',
    SUD: 'Sud'
  };

  // Force region to agent's region if they don't have TOUT access
  useEffect(() => {
    if (agent?.REGION && agent.REGION !== 'TOUT') {
      setActiveRegion(agent.REGION as 'all' | 'OUEST' | 'EST' | 'SUD');
    }
  }, [agent?.REGION]);

  useEffect(() => {
    if (isOpen) {
      loadAllSuppliers();
    }
  }, [isOpen, activeRegion, selectedYear, selectedMonth]);

  const loadAllSuppliers = async () => {
    setDataLoading(true);
    try {
      const region = activeRegion === 'all' ? undefined : activeRegion;
      const data = await dashboardService.getTop10SuppliersWithUnpaidInvoices(selectedYear, region);
      
      // Trier par montant décroissant
      const sorted = [...(data || [])].sort((a, b) => b.montantNonPaye - a.montantNonPaye);
      
      console.log('Données chargées (toutes régions):', sorted);
      setSuppliersData(sorted);
    } catch (err) {
      console.error('Erreur lors du chargement des fournisseurs:', err);
      setSuppliersData([]);
    } finally {
      setDataLoading(false);
    }
  };

  const handleSupplierClick = async (supplier: string) => {
    try {
      // Get all invoices for this supplier from all statuses
      const region = activeRegion === 'all' ? undefined : activeRegion;
      const [nonPayee, bonAPayer, payee, partiellementPayee, echue, rejetee] = await Promise.all([
        dashboardService.getNonPayeeInvoices(selectedYear, region),
        dashboardService.getBonAPayerInvoices(selectedYear, region),
        dashboardService.getPayeeInvoices(selectedYear, region),
        dashboardService.getPartiellementPayeeInvoices(selectedYear, region),
        dashboardService.getOverdueInvoices(selectedYear, region),
        dashboardService.getRejeteesInvoices(selectedYear, region),
      ]);
      
      let invoices = [...nonPayee, ...bonAPayer, ...payee, ...partiellementPayee, ...echue, ...rejetee] as Invoice[];
      
      // Filter by supplier
      let filtered = invoices.filter(inv => inv.Fournisseur === supplier);
      
      // Filter by region if selected
      if (activeRegion !== 'all') {
        filtered = filtered.filter(inv => inv['Région'] === activeRegion);
      }
      
      // Remove duplicates
      const seen = new Set();
      filtered = filtered.filter((inv) => {
        const key = inv['Numéro de facture'];
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      
      setSelectedInvoices(filtered);
      setSelectedSupplier(supplier);
      setShowInvoiceModal(true);
    } catch (err) {
      console.error('Erreur lors du chargement des factures:', err);
    }
  };

  const handlePrint = () => {
    if (!modalRef.current) return;

    // Créer une copie du modal pour l'impression
    const printContent = modalRef.current.cloneNode(true) as HTMLElement;
    
    // Masquer les boutons de contrôle dans la copie
    const buttons = printContent.querySelectorAll('button');
    buttons.forEach(btn => btn.style.display = 'none');

    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '', 'height=800,width=1200');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: landscape; margin: 0.5cm; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
            padding: 1rem;
            width: 100%;
            height: 100%;
          }
          .bg-white { background: white; }
          .bg-gray-200 { background: #e5e7eb; }
          .bg-gray-100 { background: #f3f4f6; }
          .text-sm { font-size: 0.875rem; }
          .text-xs { font-size: 0.75rem; }
          .font-bold { font-weight: 700; }
          .font-medium { font-weight: 500; }
          .border-b { border-bottom: 1px solid #e5e7eb; }
          .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
          .rounded-lg { border-radius: 0.5rem; }
          .overflow-hidden { overflow: hidden; }
          .flex { display: flex; }
          .flex-col { flex-direction: column; }
          .items-center { align-items: center; }
          .justify-between { justify-content: space-between; }
          .gap-2 { gap: 0.5rem; }
          .gap-4 { gap: 1rem; }
          .p-3 { padding: 0.75rem; }
          .p-4 { padding: 1rem; }
          .px-4 { padding-left: 1rem; padding-right: 1rem; }
          .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
          .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
          .mt-4 { margin-top: 1rem; }
          .ml-auto { margin-left: auto; }
          .w-full { width: 100%; }
          .max-w-6xl { max-width: 80rem; }
          .text-gray-900 { color: #111827; }
          .text-gray-700 { color: #374151; }
          .text-gray-600 { color: #4b5563; }
          .text-red-600 { color: #dc2626; }
          .bg-red-100 { background: #fee2e2; }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleShareByEmail = async () => {
    if (!modalRef.current) return;

    try {
      const canvas = await html2canvas(modalRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      // Convert to blob for email
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });

      const subject = encodeURIComponent(`Top 10 Fournisseurs - Région: ${regionLabels[activeRegion]} (${selectedYear})`);
      const body = encodeURIComponent(
        `Bonjour,\n\nVeuillez trouver ci-joint l'analyse des Top 10 Fournisseurs pour la région ${regionLabels[activeRegion]} en ${selectedYear}.\n\nRésumé:\nLes 3 premiers fournisseurs représentent ${calculateTopSuppliersPercentage()}% du montant total.\n\nCordialement`
      );
      
      const mailtoLink = `https://mail.google.com/mail/u/0/?ui=2&fs=1&su=${subject}&body=${body}`;
      window.open(mailtoLink, '_blank');

      // Copy image to clipboard
      navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]).catch(() => {
        console.log('Image prête à coller dans le mail');
      });
    } catch (err) {
      console.error('Erreur lors de la préparation de l\'image:', err);
      alert('Erreur lors de la préparation de l\'image');
    }
  };

  const getFilteredSuppliers = (data: typeof suppliers) => {
    return [...data].sort((a, b) => b.montantNonPaye - a.montantNonPaye).slice(0, 10);
  };

  const currentSuppliers = getFilteredSuppliers(suppliersData);
  const currentLoading = dataLoading;

  const chartData = currentSuppliers.map((s) => ({
    name: s.fournisseur.substring(0, 12),
    fullName: s.fournisseur,
    nombreFactures: s.nombreFactures,
    montant: Math.round(s.montantNonPaye * 100) / 100,
  }));

  const calculateTopSuppliersPercentage = () => {
    if (currentSuppliers.length === 0) return 0;
    const topThreeAmount = currentSuppliers.slice(0, 3).reduce((sum, s) => sum + s.montantNonPaye, 0);
    const totalAmount = currentSuppliers.reduce((sum, s) => sum + s.montantNonPaye, 0);
    return totalAmount > 0 ? Math.round((topThreeAmount / totalAmount) * 100) : 0;
  };

  return (
    <>
      {isOpen && (
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:bg-transparent print:p-0 ${isFullScreen ? 'fixed inset-0' : ''}`}>
          <div 
            ref={modalRef}
            className={`bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col print:rounded-none print:shadow-none print:max-w-none print:max-h-none ${
              isFullScreen 
                ? 'fixed inset-4 max-w-none' 
                : 'max-w-6xl w-full mx-4 h-[85vh]'
            }`}
          >
            {/* Header */}
            <div className="bg-gray-200 border-b p-3 shadow-md flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">
                Top 10 Fournisseurs
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="p-2 text-gray-600 hover:text-white hover:bg-red-500 rounded-full transition-all duration-200"
                  title="Imprimer"
                >
                  <Printer size={18} />
                </button>
                <button
                  onClick={handleShareByEmail}
                  className="p-2 text-gray-600 hover:text-white hover:bg-red-500 rounded-full transition-all duration-200"
                  title="Partager par mail"
                >
                  <Mail size={18} />
                </button>
                <button
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="p-2 text-gray-600 hover:text-white hover:bg-red-500 rounded-full transition-all duration-200"
                  title="Plein écran"
                >
                  <Maximize2 size={18} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-600 hover:text-white hover:bg-red-500 rounded-full transition-all duration-200"
                  title="Fermer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Tabs - Regions */}
            <div className="flex bg-gray-100 border-b items-center px-4">
              <div className="flex gap-1">
                {(() => {
                  // Si l'utilisateur a TOUT, afficher tous les onglets
                  if (agent?.REGION === 'TOUT') {
                    return regions.map((region) => (
                      <button
                        key={region}
                        onClick={() => setActiveRegion(region)}
                        className={`px-4 py-2 text-xs font-medium transition-all duration-150 ease-out ${
                          activeRegion === region
                            ? 'bg-white text-gray-900 border-b-2 border-red-500'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {regionLabels[region]}
                      </button>
                    ));
                  } else {
                    // Sinon, afficher uniquement l'onglet de la région de l'utilisateur
                    const userRegion = agent?.REGION as 'OUEST' | 'EST' | 'SUD';
                    return (
                      <button
                        key={userRegion}
                        onClick={() => setActiveRegion(userRegion)}
                        className={`px-4 py-2 text-xs font-medium transition-all duration-150 ease-out ${
                          activeRegion === userRegion
                            ? 'bg-white text-gray-900 border-b-2 border-red-500'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {regionLabels[userRegion]}
                      </button>
                    );
                  }
                })()}
              </div>
              <div className="ml-auto flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-700">Année:</label>
                  <select 
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-700">Mois:</label>
                  <select 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 flex gap-6">
              {currentLoading ? (
                <div className="flex items-center justify-center w-full">
                  <div className="text-gray-500">Chargement des données...</div>
                </div>
              ) : currentSuppliers.length === 0 ? (
                <div className="flex items-center justify-center w-full">
                  <div className="text-gray-500">Aucun fournisseur disponible</div>
                </div>
              ) : (
                <>
                  {/* Left side - List (30%) */}
                  <div className="w-3/10 space-y-2 flex-shrink-0">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">
                      Liste des Fournisseurs
                    </h3>
                    <div className="space-y-2 overflow-y-auto max-h-[55vh]">
                      {currentSuppliers.map((supplier, index) => (
                        <div
                          key={supplier.fournisseur}
                          onClick={() => handleSupplierClick(supplier.fournisseur)}
                          className={`cursor-pointer border rounded-lg p-2 transition-colors border-gray-200 hover:bg-red-50 hover:border-red-300`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900 text-xs">
                                {index + 1}. {supplier.fournisseur}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                <span className="font-medium">
                                  {supplier.nombreFactures}
                                </span>{' '}
                                factures
                              </div>
                              <div className={`text-xs font-semibold mt-1 text-red-600`}>
                                USD {formatCurrency(supplier.montantNonPaye)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right side - Chart (70%) */}
                  <div className="flex-1 flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-800 mb-0">
                      Graphique
                    </h3>
                    {currentSuppliers.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={500}>
                          <ComposedChart
                            data={chartData}
                            margin={{ top: 20, right: 30, left: 30, bottom: 80 }}
                            onClick={(state) => {
                              if (state.activeLabel) {
                                const supplier = chartData.find(d => d.name === state.activeLabel);
                                if (supplier) {
                                  handleSupplierClick(supplier.fullName);
                                }
                              }
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="name"
                              angle={0}
                              textAnchor="middle"
                              height={80}
                              tick={{ fontSize: 10, fontWeight: 'bold', fill: '#000000' }}
                            />
                            <YAxis
                              label={{ value: 'Montant (USD)', angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: 'bold', fill: '#000000' }}
                              tick={{ fontSize: 10, fontWeight: 'bold', fill: '#000000' }}
                              domain={[0, 'dataMax']}
                            />
                            <Tooltip
                              cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-white p-2 border border-gray-300 rounded shadow-lg">
                                      <p className="font-semibold text-xs">
                                        {data.fullName}
                                      </p>
                                      <p className="text-xs font-semibold text-blue-600">
                                        Montant: ${formatCurrency(data.montant)}
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar
                              dataKey="montant"
                              name="Montant (USD)"
                              radius={[8, 8, 0, 0]}
                              label={{ 
                                position: 'top',
                                formatter: (value: any) => `$${formatCurrency(value)}`,
                                fill: '#000000',
                                fontSize: 10,
                                fontWeight: 'bold'
                              }}
                              onClick={(data: any) => {
                                handleSupplierClick(data.fullName);
                              }}
                            >
                              {chartData.map((entry, index) => {
                                const maxMontant = Math.max(...chartData.map(d => d.montant));
                                const ratio = entry.montant / maxMontant;
                                const grayValue = Math.round(130 + ratio * 90);
                                const color = `#${grayValue.toString(16)}${grayValue.toString(16)}${grayValue.toString(16)}`;
                                return <Cell key={`cell-${index}`} fill={color} />;
                              })}
                            </Bar>
                            <Line
                              type="monotone"
                              dataKey="montant"
                              stroke="#ef4444"
                              strokeWidth={3}
                              dot={{ fill: '#dc2626', r: 5 }}
                              isAnimationActive={true}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-96">
                        <p className="text-gray-500">Aucune donnée disponible</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer avec commentaire */}
            <div className="bg-gray-100 p-4">
              <p className="text-xs italic text-center text-gray-600">
                {currentSuppliers.length > 0 && (
                  `Région sélectionnée: ${regionLabels[activeRegion]} | Les 3 premiers fournisseurs concentrent ${calculateTopSuppliersPercentage()}% du montant total. Priorité à optimiser les délais et négociations avec ces partenaires clés.`
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        title={`Factures - ${selectedSupplier}`}
        invoices={selectedInvoices}
      />
    </>
  );
}

export default Top10SuppliersModal;
