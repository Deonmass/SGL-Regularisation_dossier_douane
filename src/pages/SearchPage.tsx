import { useState, useEffect } from 'react';
import { Search, ChevronDown, RefreshCw, Download } from 'lucide-react';
import { supabase } from '../services/supabase';
import * as XLSX from 'xlsx';
import { usePermission } from '../hooks/usePermission';
import { useAuth } from '../contexts/AuthContext';
import AccessDenied from '../components/AccessDenied';
import ViewInvoiceModal from '../components/ViewInvoiceModal';
import PaiementModal from '../components/PaiementModal';
import { Invoice as GlobalInvoice } from '../types';

interface SearchPageProps {
  activeMenu?: string;
  menuTitle?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  supplier: string;
  manager: string;
  costCenter: string;
  date: string;
  amount: number;
  status: string;
  currency: string;
  region: string;
  totalPaid: number;
  restAPayer: number;
  dueDate: string | null;
  isRejected: boolean;
}

function SearchPage({ menuTitle = 'Recherche avancée' }: SearchPageProps) {
  const { canView } = usePermission();
  const { agent } = useAuth();
  const regions = ['OUEST', 'EST', 'SUD'];
  const years = ['2030', '2029', '2028', '2027', '2026', '2025'];

  // Main state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<GlobalInvoice | null>(null);
  const [showViewInvoiceModal, setShowViewInvoiceModal] = useState(false);
  const [showPaiementModal, setShowPaiementModal] = useState(false);

  // Collapse states
  const [unpaidCollapsed, setUnpaidCollapsed] = useState(true);
  const [overdueCollapsed, setOverdueCollapsed] = useState(true);
  const [rejectedCollapsed, setRejectedCollapsed] = useState(true);
  const [paidCollapsed, setPaidCollapsed] = useState(true);

  // Selected supplier state
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{label: string, value: string, type: string, supplier?: string, amount?: number, date?: string, invoiceNumber?: string}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  // If agent has TOUT, show all regions. Otherwise, show only their region
  const [selectedRegion, setSelectedRegion] = useState<string>(agent?.REGION && agent.REGION !== 'TOUT' ? agent.REGION : '');
  const [selectedYear, setSelectedYear] = useState<string>('2026');

  // Advanced filters
  const [filterDateType, setFilterDateType] = useState<string>('all');
  const [filterDateStart, setFilterDateStart] = useState<string>('');
  const [filterDateEnd, setFilterDateEnd] = useState<string>('');

  if (!canView('recherche')) {
    return <AccessDenied message="Vous n'avez pas accès à la recherche." />;
  }

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Construire la requête avec filtrage par région si nécessaire
      let query = supabase
        .from('FACTURES')
        .select('ID, "Numéro de facture", Fournisseur, "Gestionnaire", "Centre de coût", "Date de réception", Montant, Statut, Devise, "Région", "Échéance", "Catégorie fournisseur"');

      // Filtrer par région si l'utilisateur n'a pas TOUT
      if (agent?.REGION && agent.REGION !== 'TOUT') {
        query = query.eq('Région', agent.REGION);
      }

      const { data: factures, error } = await query;
        
        if (error) {
          console.error('Erreur lors de la récupération des factures:', error);
          setLoading(false);
          return;
        }

        const { data: paiements } = await supabase
          .from('PAIEMENTS')
          .select('id, montantPaye');

        const paidMap = new Map<string, number>();
        paiements?.forEach((p: any) => {
          const invoiceNum = String(p.id || '').split('-')[0].trim();
          const montant = parseFloat(String(p.montantPaye || 0));
          paidMap.set(invoiceNum, (paidMap.get(invoiceNum) || 0) + montant);
        });

        const processedInvoices: Invoice[] = factures?.map((f: Record<string, unknown>) => {
          const invoiceNum = String(f['Numéro de facture'] || '').trim();
          const amount = parseFloat(String(f.Montant)) || 0;
          const totalPaid = paidMap.get(invoiceNum) || 0;
          const restAPayer = Math.max(0, amount - totalPaid);
          const dueDate = f['Échéance'] ? String(f['Échéance']) : null;
          const statusUpper = String(f.Statut || '').toUpperCase();
          const isRejected = statusUpper.includes('REJET');

          return {
            id: String(f.ID),
            invoiceNumber: invoiceNum,
            supplier: String(f.Fournisseur || '').trim(),
            manager: String(f.Gestionnaire || '').trim(),
            costCenter: String(f['Centre de coût'] || '').trim(),
            date: String(f['Date de réception'] || ''),
            amount,
            status: isRejected ? 'REJETÉE' : totalPaid > 0 && restAPayer > 0 ? 'PARTIELLEMENT PAYÉE' : totalPaid > 0 ? 'PAYÉE' : dueDate && new Date(dueDate) < new Date() ? 'ÉCHUE' : 'NON PAYÉE',
            currency: String(f.Devise || 'USD'),
            region: String(f.Région || 'OUEST'),
            totalPaid,
            restAPayer,
            dueDate,
            isRejected
          };
        }) || [];

        setInvoices(processedInvoices);

      } catch (err) {
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get list of unique suppliers with unpaid or overdue invoices - with filtering
  const getUnpaidSuppliers = () => {
    const suppliersMap = new Map<string, { totalUnpaid: number; count: number }>();
    
    invoices.forEach(inv => {
      // Filter by region if selected
      if (selectedRegion && inv.region !== selectedRegion) return;
      
      // Year filter
      if (selectedYear) {
        const invYear = new Date(inv.date).getFullYear().toString();
        if (invYear !== selectedYear) return;
      }
      
      // Date range filter
      if (filterDateType !== 'all' && filterDateStart && filterDateEnd) {
        const start = new Date(filterDateStart);
        const end = new Date(filterDateEnd);
        const invDate = new Date(inv.date);
        if (!(invDate >= start && invDate <= end)) return;
      } else if (filterDateType !== 'all' && filterDateType !== 'custom') {
        const today = new Date();
        const iDate = new Date(inv.date);
        
        if (filterDateType === 'week') {
          const dayOfWeek = today.getDay();
          const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() + daysToMonday);
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          if (!(iDate >= weekStart && iDate <= weekEnd)) return;
        } else if (filterDateType === 'month') {
          if (!(iDate.getMonth() === today.getMonth() && iDate.getFullYear() === today.getFullYear())) return;
        } else if (filterDateType === 'trimester') {
          const currentTrimester = Math.floor(today.getMonth() / 3);
          const invoiceTrimester = Math.floor(iDate.getMonth() / 3);
          if (!(invoiceTrimester === currentTrimester && iDate.getFullYear() === today.getFullYear())) return;
        } else if (filterDateType === 'semester') {
          const currentSemester = today.getMonth() < 6 ? 0 : 1;
          const invoiceSemester = iDate.getMonth() < 6 ? 0 : 1;
          if (!(invoiceSemester === currentSemester && iDate.getFullYear() === today.getFullYear())) return;
        }
      }
      
      // Include unpaid, partially paid, AND overdue invoices
      if ((inv.status === 'NON PAYÉE' && !inv.isRejected) || inv.status === 'PARTIELLEMENT PAYÉE' || inv.status === 'ÉCHUE') {
        const unpaidAmount = inv.status === 'NON PAYÉE' ? inv.amount : inv.restAPayer;
        const current = suppliersMap.get(inv.supplier) || { totalUnpaid: 0, count: 0 };
        suppliersMap.set(inv.supplier, {
          totalUnpaid: current.totalUnpaid + unpaidAmount,
          count: current.count + 1
        });
      }
    });
    
    return Array.from(suppliersMap.entries())
      .map(([supplier, data]) => ({ supplier, ...data }))
      .sort((a, b) => b.totalUnpaid - a.totalUnpaid);
  };

  // Filter invoices based on all criteria
  const getFilteredInvoices = () => {
    let filtered = [...invoices];

    // Search term - recherche dans multiple champs
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(term) ||
        inv.supplier.toLowerCase().includes(term) ||
        inv.costCenter.toLowerCase().includes(term)
      );
    }

    // Region
    if (selectedRegion) {
      filtered = filtered.filter(inv => inv.region === selectedRegion);
    }

    // Supplier filter - only show invoices for selected supplier
    if (selectedSupplier) {
      filtered = filtered.filter(inv => inv.supplier === selectedSupplier);
    }

    // Year
    if (selectedYear) {
      filtered = filtered.filter(inv => {
        const invYear = new Date(inv.date).getFullYear().toString();
        return invYear === selectedYear;
      });
    }

    // Date range
    if (filterDateType !== 'all' && filterDateStart && filterDateEnd) {
      const start = new Date(filterDateStart);
      const end = new Date(filterDateEnd);
      filtered = filtered.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate >= start && invDate <= end;
      });
    } else if (filterDateType !== 'all' && filterDateType !== 'custom') {
      const today = new Date();
      
      filtered = filtered.filter(inv => {
        const iDate = new Date(inv.date);
        
        if (filterDateType === 'week') {
          // Semaine: lundi à dimanche
          const dayOfWeek = today.getDay(); // 0 = dimanche, 1 = lundi, ..., 6 = samedi
          const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() + daysToMonday);
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          return iDate >= weekStart && iDate <= weekEnd;
        } else if (filterDateType === 'month') {
          return iDate.getMonth() === today.getMonth() && iDate.getFullYear() === today.getFullYear();
        } else if (filterDateType === 'trimester') {
          const currentTrimester = Math.floor(today.getMonth() / 3);
          const invoiceTrimester = Math.floor(iDate.getMonth() / 3);
          return invoiceTrimester === currentTrimester && iDate.getFullYear() === today.getFullYear();
        } else if (filterDateType === 'semester') {
          const currentSemester = today.getMonth() < 6 ? 0 : 1;
          const invoiceSemester = iDate.getMonth() < 6 ? 0 : 1;
          return invoiceSemester === currentSemester && iDate.getFullYear() === today.getFullYear();
        }
        
        return true;
      });
    }

    return filtered;
  };

  // Générer les suggestions de recherche
  const generateSearchSuggestions = (term: string) => {
    if (term.length < 1) {
      setSearchSuggestions([]);
      return;
    }

    const lowerTerm = term.toLowerCase();
    const suggestions = new Map<string, typeof searchSuggestions[0]>();

    invoices.forEach(inv => {
      // Numéro de facture
      if (inv.invoiceNumber.toLowerCase().includes(lowerTerm)) {
        const key = `facture-${inv.invoiceNumber}`;
        if (!suggestions.has(key)) {
          suggestions.set(key, { 
            label: `Facture: ${inv.invoiceNumber}`, 
            value: inv.invoiceNumber, 
            type: 'facture',
            supplier: inv.supplier,
            amount: inv.amount,
            date: inv.date,
            invoiceNumber: inv.invoiceNumber
          });
        }
      }

      // Fournisseur
      if (inv.supplier.toLowerCase().includes(lowerTerm)) {
        const key = `supplier-${inv.supplier}`;
        if (!suggestions.has(key)) {
          suggestions.set(key, { 
            label: `Fournisseur: ${inv.supplier}`, 
            value: inv.supplier, 
            type: 'supplier',
            supplier: inv.supplier
          });
        }
      }

      // Centre de coût
      if (inv.costCenter.toLowerCase().includes(lowerTerm)) {
        const key = `cost-${inv.costCenter}`;
        if (!suggestions.has(key)) {
          suggestions.set(key, { 
            label: `Centre de coût: ${inv.costCenter}`, 
            value: inv.costCenter, 
            type: 'costcenter'
          });
        }
      }
    });

    setSearchSuggestions(Array.from(suggestions.values()).slice(0, 8));
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    generateSearchSuggestions(value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: typeof searchSuggestions[0]) => {
    setSearchTerm(suggestion.value);
    setSearchSuggestions([]);
    setShowSuggestions(false);
  };

  // Generate filter description subtitle
  const getFilterDescription = (): string => {
    const parts: string[] = [];

    if (selectedRegion) {
      parts.push(`Région: ${selectedRegion}`);
    }

    if (selectedYear && selectedYear !== '2026') {
      parts.push(`Année: ${selectedYear}`);
    }

    if (filterDateType !== 'all') {
      const today = new Date();
      
      if (filterDateType === 'week') {
        // Semaine: lundi à dimanche
        const dayOfWeek = today.getDay(); // 0 = dimanche, 1 = lundi, ..., 6 = samedi
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() + daysToMonday);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const startStr = weekStart.toLocaleDateString('fr-FR');
        const endStr = weekEnd.toLocaleDateString('fr-FR');
        parts.push(`Filtre: Cette semaine (${startStr} au ${endStr})`);
      } else if (filterDateType === 'month') {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const startStr = monthStart.toLocaleDateString('fr-FR');
        const endStr = monthEnd.toLocaleDateString('fr-FR');
        parts.push(`Filtre: Ce mois (${startStr} au ${endStr})`);
      } else if (filterDateType === 'trimester') {
        const quarter = Math.floor(today.getMonth() / 3);
        const trimStart = new Date(today.getFullYear(), quarter * 3, 1);
        const trimEnd = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
        const startStr = trimStart.toLocaleDateString('fr-FR');
        const endStr = trimEnd.toLocaleDateString('fr-FR');
        parts.push(`Filtre: Ce trimestre (${startStr} au ${endStr})`);
      } else if (filterDateType === 'semester') {
        const semester = today.getMonth() < 6 ? 0 : 1;
        const semStart = new Date(today.getFullYear(), semester * 6, 1);
        const semEnd = new Date(today.getFullYear(), (semester + 1) * 6, 0);
        const startStr = semStart.toLocaleDateString('fr-FR');
        const endStr = semEnd.toLocaleDateString('fr-FR');
        parts.push(`Filtre: Ce semestre (${startStr} au ${endStr})`);
      } else if (filterDateType === 'custom' && filterDateStart && filterDateEnd) {
        const startDate = new Date(filterDateStart).toLocaleDateString('fr-FR');
        const endDate = new Date(filterDateEnd).toLocaleDateString('fr-FR');
        parts.push(`Filtre: Du ${startDate} au ${endDate}`);
      }
    }

    if (searchTerm.trim()) {
      parts.push(`Recherche: "${searchTerm}"`);
    }

    return parts.length > 0 ? `Filtres appliqués: ${parts.join(' • ')}` : 'Aucun filtre appliqué';
  };

  const allFiltered = getFilteredInvoices();

  // Categorize invoices
  // Factures non payées: inclut NON PAYÉE (amount complet) + PARTIELLEMENT PAYÉE (restAPayer)
  const unpaidInvoices = allFiltered.filter(inv => 
    (inv.status === 'NON PAYÉE' && !inv.isRejected) || 
    (inv.status === 'PARTIELLEMENT PAYÉE')
  );
  const overdueInvoices = allFiltered.filter(inv => inv.status === 'ÉCHUE');
  const rejectedInvoices = allFiltered.filter(inv => inv.isRejected);
  const paidInvoices = allFiltered.filter(inv => inv.status === 'PAYÉE');

  // Calculate totals
  // Pour les factures non payées: amount pour NON PAYÉE, restAPayer pour PARTIELLEMENT PAYÉE
  const unpaidTotal = unpaidInvoices.reduce((sum, inv) => {
    if (inv.status === 'NON PAYÉE') return sum + inv.amount;
    if (inv.status === 'PARTIELLEMENT PAYÉE') return sum + inv.restAPayer;
    return sum;
  }, 0);
  const overdueTotal = overdueInvoices.reduce((sum, inv) => sum + inv.restAPayer, 0);
  const rejectedTotal = rejectedInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidTotal = paidInvoices.reduce((sum, inv) => sum + inv.totalPaid, 0);

  // Handlers for export and refresh
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const { data: factures, error } = await supabase
        .from('FACTURES')
        .select('ID, "Numéro de facture", Fournisseur, "Gestionnaire", "Centre de coût", "Date de réception", Montant, Statut, Devise, "Région", "Échéance", "Catégorie fournisseur"');
      
      if (error) {
        console.error('Erreur lors de la récupération des factures:', error);
        return;
      }

      const { data: paiements } = await supabase
        .from('PAIEMENTS')
        .select('id, montantPaye');

      const paidMap = new Map<string, number>();
      paiements?.forEach((p: any) => {
        const invoiceNum = String(p.id || '').split('-')[0].trim();
        const montant = parseFloat(String(p.montantPaye || 0));
        paidMap.set(invoiceNum, (paidMap.get(invoiceNum) || 0) + montant);
      });

      const processedInvoices: Invoice[] = factures?.map((f: Record<string, unknown>) => {
        const invoiceNum = String(f['Numéro de facture'] || '').trim();
        const amount = parseFloat(String(f.Montant)) || 0;
        const totalPaid = paidMap.get(invoiceNum) || 0;
        const restAPayer = Math.max(0, amount - totalPaid);
        const dueDate = f['Échéance'] ? String(f['Échéance']) : null;
        const statusUpper = String(f.Statut || '').toUpperCase();
        const isRejected = statusUpper.includes('REJET');

        return {
          id: String(f.ID),
          invoiceNumber: invoiceNum,
          supplier: String(f.Fournisseur || '').trim(),
          manager: String(f.Gestionnaire || '').trim(),
          costCenter: String(f['Centre de coût'] || '').trim(),
          date: String(f['Date de réception'] || ''),
          amount,
          status: isRejected ? 'REJETÉE' : totalPaid > 0 && restAPayer > 0 ? 'PARTIELLEMENT PAYÉE' : totalPaid > 0 ? 'PAYÉE' : dueDate && new Date(dueDate) < new Date() ? 'ÉCHUE' : 'NON PAYÉE',
          currency: String(f.Devise || 'USD'),
          region: String(f.Région || 'OUEST'),
          totalPaid,
          restAPayer,
          dueDate,
          isRejected
        };
      }) || [];

      setInvoices(processedInvoices);
    } catch (err) {
      console.error('Erreur lors de l\'actualisation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = () => {
    if (allFiltered.length === 0) {
      alert('Aucune facture à exporter');
      return;
    }

    const exportData = allFiltered.map(inv => ({
      'Numéro de facture': inv.invoiceNumber,
      'Fournisseur': inv.supplier,
      'Montant': inv.amount,
      'Devise': inv.currency,
      'Date': inv.date,
      'Statut': inv.status,
      'Région': inv.region,
      'Gestionnaire': inv.manager
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Recherche');
    const fileName = `Recherche_factures_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleInvoiceClick = async (invoice: Invoice) => {
    try {
      const globalInvoice: GlobalInvoice = {
        id: parseInt(invoice.id),
        invoiceNumber: invoice.invoiceNumber,
        supplier: invoice.supplier,
        receptionDate: invoice.date,
        amount: invoice.amount,
        currency: (invoice.currency === 'USD' || invoice.currency === 'CDF' || invoice.currency === 'EUR') ? invoice.currency : 'USD',
        chargeCategory: '',
        urgencyLevel: 'Basse',
        status: invoice.status === 'PAYÉE' ? 'paid' : 'pending',
        region: (invoice.region as 'OUEST' | 'SUD' | 'EST' | 'NORD') || 'OUEST',
        validations: 0,
        emissionDate: invoice.date,
      };

      setSelectedInvoiceForModal(globalInvoice);
      // Si totalPaid > 0, afficher PaiementModal en lecture; sinon ViewInvoiceModal
      if (invoice.totalPaid > 0) {
        setShowPaiementModal(true);
      } else {
        setShowViewInvoiceModal(true);
      }
    } catch (err) {
      console.error('Erreur:', err);
      setShowViewInvoiceModal(true);
    }
  };

  const renderCollapsibleSection = (
    title: string,
    isCollapsed: boolean,
    setCollapsed: (val: boolean) => void,
    invoices: Invoice[],
    totalAmount: number
  ) => (
    <>
      <tr 
        className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => setCollapsed(!isCollapsed)}
      >
        <td className="px-4 py-2 w-full">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
            <span className="font-semibold text-gray-900 text-sm">{title}</span>
            <ChevronDown 
              size={16} 
              className={`ml-auto transition-transform text-gray-600 ${isCollapsed ? '' : 'rotate-180'}`}
            />
          </div>
        </td>
        <td className="px-4 py-2 text-right font-semibold text-sm text-gray-900">{invoices.length}</td>
        <td className="px-4 py-2 text-right font-semibold text-sm text-gray-900">${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>

      {!isCollapsed && (
        <tr className="bg-gray-50">
          <td colSpan={3} className="px-0 py-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-900">N° Facture</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-900">Date réception</th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-900">Montant Facture</th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-900">Montant payé</th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-900">Solde à payer</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-center text-gray-500 text-xs">
                        Aucune facture
                      </td>
                    </tr>
                  ) : (
                    invoices.map(inv => (
                      <tr key={inv.id} className="border-b hover:bg-gray-100">
                        <td className="px-4 py-2 text-xs">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInvoiceClick(inv);
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {inv.invoiceNumber}
                          </button>
                        </td>
                        <td className="px-4 py-2 text-xs">{new Date(inv.date).toLocaleDateString('fr-FR')}</td>
                        <td className="px-4 py-2 text-right font-semibold text-xs text-gray-900">
                          ${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-xs text-gray-900">
                          ${inv.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-xs">
                          <span className="inline-block bg-red-500 text-white px-2 py-1 rounded">
                            ${inv.restAPayer.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gray-100 p-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{menuTitle}</h1>
        
        {/* Filter Description Subtitle - Right under title */}
        <p className="text-xs text-gray-600 mb-4 italic">{getFilterDescription()}</p>

        {/* Onglets et Contrôles */}
        <div className="flex items-center justify-between mb-4">
          {/* Region Tabs */}
          <div className="flex gap-2 flex-wrap">
            {/* If agent has TOUT, show all region tabs */}
            {agent?.REGION === 'TOUT' ? (
              <>
                <button
                  onClick={() => setSelectedRegion('')}
                  className={`px-4 py-2 text-sm rounded-t-lg transition-all duration-150 ease-out ${
                    selectedRegion === '' ? 'font-bold text-black bg-white' : 'text-gray-600'
                  }`}
                >
                  Toutes les régions
                </button>
                <button
                  onClick={() => setSelectedRegion('OUEST')}
                  className={`px-4 py-2 text-sm rounded-t-lg transition-all duration-150 ease-out ${
                    selectedRegion === 'OUEST' ? 'font-bold text-black bg-white' : 'text-gray-600'
                  }`}
                >
                  OUEST
                </button>
                <button
                  onClick={() => setSelectedRegion('EST')}
                  className={`px-4 py-2 text-sm rounded-t-lg transition-all duration-150 ease-out ${
                    selectedRegion === 'EST' ? 'font-bold text-black bg-white' : 'text-gray-600'
                  }`}
                >
                  EST
                </button>
                <button
                  onClick={() => setSelectedRegion('SUD')}
                  className={`px-4 py-2 text-sm rounded-t-lg transition-all duration-150 ease-out ${
                    selectedRegion === 'SUD' ? 'font-bold text-black bg-white' : 'text-gray-600'
                  }`}
                >
                  SUD
                </button>
              </>
            ) : (
              /* Otherwise show only their region */
              <button
                disabled
                className="px-4 py-2 text-sm rounded-t-lg font-bold text-black bg-white"
              >
                {agent?.REGION || 'Région inconnue'}
              </button>
            )}
          </div>

          {/* Boutons Refresh et Export */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-all disabled:opacity-50"
              title="Actualiser les données"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
            <button
              onClick={handleExportToExcel}
              className="flex items-center gap-1 px-2 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-all"
              title="Exporter en Excel"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Excel</span>
            </button>
          </div>
        </div>

        {/* Search bar hidden */}

        {/* White Background Container for Filters */}
        <div className="bg-white p-4 rounded-lg mt-2">
          {/* Advanced Filters */}
          <div className={`grid gap-2 ${filterDateType === 'custom' ? 'grid-cols-1 md:grid-cols-5' : 'grid-cols-1 md:grid-cols-2'}`}>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <select
            value={filterDateType}
            onChange={(e) => setFilterDateType(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Toutes dates</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="trimester">Ce trimestre</option>
            <option value="semester">Ce semestre</option>
            <option value="custom">Personnalisé</option>
          </select>

          {filterDateType === 'custom' && (
            <>
              <input
                type="date"
                value={filterDateStart}
                onChange={(e) => setFilterDateStart(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <span className="flex items-center text-xs text-gray-600 justify-center">au</span>
              
              <input
                type="date"
                value={filterDateEnd}
                onChange={(e) => setFilterDateEnd(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </>
          )}
          </div>
        </div>
      </div>

      {/* Content - Two Column Layout */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500 text-lg">Chargement des données...</p>
        </div>
      ) : (
        <div className="px-4 pb-4 overflow-hidden">
          <div className={`flex gap-0 transition-all duration-300 ease-out ${selectedSupplier ? 'lg:gap-4' : ''}`}>
            {/* Left Column - 30% - List of Suppliers with Unpaid/Overdue Invoices */}
            <div className={`flex-shrink-0 transition-all duration-300 ease-out ${
              selectedSupplier 
                ? 'w-full lg:w-1/3 lg:border-r-4 lg:border-blue-200 lg:pr-4' 
                : 'w-full lg:w-80'
            } border border-gray-200 rounded-lg p-4 bg-white`}>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Fournisseurs avec solde à payer</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {getUnpaidSuppliers().length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Aucun fournisseur avec factures non payées
                  </div>
                ) : (
                  getUnpaidSuppliers().map((item) => (
                    <div
                      key={item.supplier}
                      onClick={() => setSelectedSupplier(selectedSupplier === item.supplier ? null : item.supplier)}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 overflow-hidden ${
                        selectedSupplier === item.supplier
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="font-semibold text-sm break-words">{item.supplier}</div>
                      <div className={`text-xs mt-1 ${
                        selectedSupplier === item.supplier ? 'text-blue-100' : 'text-gray-600'
                      }`}>
                        <span>Solde à payer: <span className="font-bold">${item.totalUnpaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
                      </div>
                      <div className={`text-xs mt-1 ${
                        selectedSupplier === item.supplier ? 'text-blue-100' : 'text-gray-600'
                      }`}>
                        <span>{item.count} facture{item.count > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Column - 70% - Invoice Status Sections (Hidden by default, shown only when supplier selected) */}
            {selectedSupplier && (
              <div className="w-full lg:w-2/3 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-lg transition-all duration-300 ease-out animate-fadeIn">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                  <p className="text-sm font-semibold text-blue-900">Factures pour: <span className="text-blue-700">{selectedSupplier}</span></p>
                </div>
                <div className="overflow-hidden">
                  <table className="w-full">
                    <tbody>
                      {renderCollapsibleSection(
                        'Factures non payées',
                        unpaidCollapsed,
                        setUnpaidCollapsed,
                        unpaidInvoices,
                        unpaidTotal
                      )}
                      {renderCollapsibleSection(
                        'Factures échues',
                        overdueCollapsed,
                        setOverdueCollapsed,
                        overdueInvoices,
                        overdueTotal
                      )}
                      {renderCollapsibleSection(
                        'Factures rejetées',
                        rejectedCollapsed,
                        setRejectedCollapsed,
                        rejectedInvoices,
                        rejectedTotal
                      )}
                      {renderCollapsibleSection(
                        'Factures payées',
                        paidCollapsed,
                        setPaidCollapsed,
                        paidInvoices,
                        paidTotal
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showViewInvoiceModal && selectedInvoiceForModal && (
        <ViewInvoiceModal
          invoice={selectedInvoiceForModal}
          onClose={() => setShowViewInvoiceModal(false)}
        />
      )}
      {showPaiementModal && selectedInvoiceForModal && (
        <PaiementModal
          invoice={selectedInvoiceForModal}
          onClose={() => setShowPaiementModal(false)}
          readOnly={true}
        />
      )}
    </div>
  );
}

export default SearchPage;
