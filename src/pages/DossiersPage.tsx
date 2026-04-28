import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Loader, Trash2, Eye, FileText } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../services/supabase';
import RegulCapitalPage from './RegulCapitalPage';
import RegulProvincesPage from './RegulProvincesPage';
import AccessDenied from '../components/AccessDenied';
import { usePermission } from '../hooks/usePermission';

interface Dossier {
  id: string;
  reference_dossier: string;
  client: string;
  region: string | null;
  point_entree: string | null;
  bureau_dedouanement: string | null;
  regime_importation: string | null;
  gestionnaire: string | null;
  declarant: string | null;
  memo: string | null;
  mode_shipment: string | null;
  reference_shipment: string | null;
  created_at: string;
}

interface DossiersPageProps {
  activeMenu?: string;
  menuTitle?: string;
  regionFilter?: string;
}

function DossiersPage({ menuTitle = 'Dossiers', regionFilter }: DossiersPageProps) {
  const { canView, canEdit, canDelete } = usePermission();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [filteredDossiers, setFilteredDossiers] = useState<Dossier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewingDossier, setViewingDossier] = useState<Dossier | null>(null);
  const [showRegulCapital, setShowRegulCapital] = useState(false);
  const [showRegulProvinces, setShowRegulProvinces] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
  const menuKey =
    regionFilter === 'Ouest'
      ? 'regularisation-ouest'
      : regionFilter === 'Est'
        ? 'regularisation-est'
        : 'regularisation-sud';

  if (!canView(menuKey)) {
    return <AccessDenied />;
  }

  const fetchDossiers = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('regularisation_dossier')
        .select('*')
        .order('created_at', { ascending: false });

      if (regionFilter) {
        query = query.eq('region', regionFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching dossiers:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Erreur lors du chargement des dossiers',
          confirmButtonColor: '#3b82f6',
        });
      } else {
        setDossiers(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors du chargement',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setLoading(false);
    }
  }, [regionFilter]);

  const filterDossiers = useCallback(() => {
    let filtered = dossiers;

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(d =>
        d.reference_dossier.toLowerCase().includes(lower) ||
        d.client.toLowerCase().includes(lower) ||
        (d.region && d.region.toLowerCase().includes(lower)) ||
        (d.point_entree && d.point_entree.toLowerCase().includes(lower)) ||
        (d.bureau_dedouanement && d.bureau_dedouanement.toLowerCase().includes(lower))
      );
    }

    setFilteredDossiers(filtered);
  }, [dossiers, searchTerm]);

  useEffect(() => {
    fetchDossiers();
  }, [fetchDossiers]);

  useEffect(() => {
    filterDossiers();
  }, [filterDossiers]);

  const handleDeleteDossier = async (dossier: Dossier) => {
    Swal.fire({
      title: 'Supprimer ce dossier?',
      text: 'Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#d1d5db',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const { error } = await supabase
            .from('regularisation_dossier')
            .delete()
            .eq('id', dossier.id);

          if (error) throw error;

          setDossiers(dossiers.filter(d => d.id !== dossier.id));
          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Dossier supprimé',
            confirmButtonColor: '#3b82f6',
          });
        } catch (err) {
          console.error('Error deleting dossier:', err);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Erreur lors de la suppression',
            confirmButtonColor: '#3b82f6',
          });
        }
      }
    });
  };

  const handleViewDossier = (dossier: Dossier) => {
    setViewingDossier(dossier);
  };

  const handleOpenRegulCapital = (dossier: Dossier) => {
    setSelectedDossier(dossier);
    setShowRegulCapital(true);
  };

  const handleCloseRegulCapital = () => {
    setShowRegulCapital(false);
    setSelectedDossier(null);
  };

  const handleRegulCapitalSaved = () => {
    fetchDossiers();
  };

  const handleOpenRegulProvinces = (dossier: Dossier) => {
    setSelectedDossier(dossier);
    setShowRegulProvinces(true);
  };

  const handleCloseRegulProvinces = () => {
    setShowRegulProvinces(false);
    setSelectedDossier(null);
  };

  const handleRegulProvincesSaved = () => {
    fetchDossiers();
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gray-200 p-2">
        <h1 className="text-2xl font-bold text-gray-900">{menuTitle}</h1>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher un dossier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchDossiers}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Dossiers Table */}
        {loading && dossiers.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="animate-spin text-blue-600" size={48} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Référence</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Client</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Région</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Point d'entrée</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Bureau douane</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Régime</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Date de création</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDossiers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      Aucun dossier trouvé
                    </td>
                  </tr>
                ) : (
                  filteredDossiers.map((dossier) => (
                    <tr key={dossier.id} className="hover:bg-gray-50 border-b">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{dossier.reference_dossier}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{dossier.client}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{dossier.region || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{dossier.point_entree || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{dossier.bureau_dedouanement || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{dossier.regime_importation || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(dossier.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleViewDossier(dossier)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Voir détails"
                          >
                            <Eye size={18} />
                          </button>
                          {regionFilter === 'Ouest' && canEdit(menuKey) && (
                            <button
                              onClick={() => handleOpenRegulCapital(dossier)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Régularisation Capital"
                            >
                              <FileText size={18} />
                            </button>
                          )}
                          {(regionFilter === 'Est' || regionFilter === 'Sud') && canEdit(menuKey) && (
                            <button
                              onClick={() => handleOpenRegulProvinces(dossier)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                              title="Régularisation Provinces"
                            >
                              <FileText size={18} />
                            </button>
                          )}
                          {canDelete(menuKey) && (
                            <button
                              onClick={() => handleDeleteDossier(dossier)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Supprimer"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de vue des détails */}
      {viewingDossier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Détails du dossier</h2>
              <button
                onClick={() => setViewingDossier(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Référence dossier</label>
                <p className="text-sm text-gray-900">{viewingDossier.reference_dossier}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                <p className="text-sm text-gray-900">{viewingDossier.client}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Région</label>
                <p className="text-sm text-gray-900">{viewingDossier.region || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Point d'entrée</label>
                <p className="text-sm text-gray-900">{viewingDossier.point_entree || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bureau de dédouanement</label>
                <p className="text-sm text-gray-900">{viewingDossier.bureau_dedouanement || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Régime d'importation</label>
                <p className="text-sm text-gray-900">{viewingDossier.regime_importation || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gestionnaire</label>
                <p className="text-sm text-gray-900">{viewingDossier.gestionnaire || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Déclarant</label>
                <p className="text-sm text-gray-900">{viewingDossier.declarant || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode shipment</label>
                <p className="text-sm text-gray-900">{viewingDossier.mode_shipment || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Référence shipment</label>
                <p className="text-sm text-gray-900">{viewingDossier.reference_shipment || '-'}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mémo</label>
                <p className="text-sm text-gray-900">{viewingDossier.memo || '-'}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de création</label>
                <p className="text-sm text-gray-900">
                  {new Date(viewingDossier.created_at).toLocaleDateString('fr-FR')} à{' '}
                  {new Date(viewingDossier.created_at).toLocaleTimeString('fr-FR')}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
              <button
                onClick={() => setViewingDossier(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Régularisation Capital */}
      {showRegulCapital && selectedDossier && (
        <RegulCapitalPage
          dossierReference={selectedDossier.reference_dossier}
          dossierClient={selectedDossier.client}
          onClose={handleCloseRegulCapital}
          onSave={handleRegulCapitalSaved}
        />
      )}

      {/* Modal de Régularisation Provinces */}
      {showRegulProvinces && selectedDossier && (
        <RegulProvincesPage
          dossierReference={selectedDossier.reference_dossier}
          dossierClient={selectedDossier.client}
          onClose={handleCloseRegulProvinces}
          onSave={handleRegulProvincesSaved}
        />
      )}
    </div>
  );
}

export default DossiersPage;
