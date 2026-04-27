import { useState, useEffect, useCallback } from 'react';
import { Edit2, Trash2, Plus, Search, RefreshCw, Loader } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../services/supabase';

interface Region {
  id: string;
  designation: string;
  ville: string | null;
  adresse: string | null;
  created_at: string;
  created_by: string | null;
}

interface NewRegion {
  designation: string;
  ville: string;
  adresse: string;
}

interface RegionPageProps {
  activeMenu?: string;
  menuTitle?: string;
}

function RegionPage({ menuTitle = 'Régions' }: RegionPageProps) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [filteredRegions, setFilteredRegions] = useState<Region[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [showNewRegionModal, setShowNewRegionModal] = useState(false);
  const [newRegion, setNewRegion] = useState<NewRegion>({
    designation: '',
    ville: '',
    adresse: ''
  });
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});

  const fetchRegions = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('region')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching regions:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Erreur lors du chargement des régions',
          confirmButtonColor: '#3b82f6',
        });
      } else {
        setRegions(data || []);
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
  }, []);

  const filterRegions = useCallback(() => {
    let filtered = regions;

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.designation.toLowerCase().includes(lower) ||
        (r.ville && r.ville.toLowerCase().includes(lower))
      );
    }

    filtered.sort((a, b) => a.designation.localeCompare(b.designation));
    setFilteredRegions(filtered);
  }, [regions, searchTerm]);

  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  useEffect(() => {
    filterRegions();
  }, [filterRegions]);

  const handleDeleteRegion = async (region: Region) => {
    Swal.fire({
      title: 'Supprimer cette région?',
      text: 'Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#d1d5db',
    }).then(async (result) => {
      if (result.isConfirmed) {
        setActionLoading({ ...actionLoading, [`${region.id}-delete`]: true });
        try {
          const { error } = await supabase
            .from('region')
            .delete()
            .eq('id', region.id);

          if (error) throw error;

          setRegions(regions.filter(r => r.id !== region.id));
          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Région supprimée',
            confirmButtonColor: '#3b82f6',
          });
        } catch (err) {
          console.error('Error deleting region:', err);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Erreur lors de la suppression',
            confirmButtonColor: '#3b82f6',
          });
        } finally {
          setActionLoading({ ...actionLoading, [`${region.id}-delete`]: false });
        }
      }
    });
  };

  const handleSaveEdit = async () => {
    if (!editingRegion) return;

    setActionLoading({ ...actionLoading, [`${editingRegion.id}-edit`]: true });
    try {
      const { error } = await supabase
        .from('region')
        .update({
          designation: editingRegion.designation,
          ville: editingRegion.ville,
          adresse: editingRegion.adresse,
        })
        .eq('id', editingRegion.id);

      if (error) throw error;

      setRegions(regions.map(r => r.id === editingRegion.id ? editingRegion : r));
      setEditingRegion(null);
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Région mise à jour',
        confirmButtonColor: '#3b82f6',
      });
    } catch (err) {
      console.error('Error updating region:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de la mise à jour',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setActionLoading({ ...actionLoading, [`${editingRegion.id}-edit`]: false });
    }
  };

  const handleAddNewRegion = async () => {
    if (!newRegion.designation) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Veuillez remplir le champ désignation',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setActionLoading({ ...actionLoading, 'add': true });
    try {
      const { data, error } = await supabase
        .from('region')
        .insert([{
          designation: newRegion.designation,
          ville: newRegion.ville || null,
          adresse: newRegion.adresse || null,
        }])
        .select();

      if (error) throw error;

      if (data) {
        setRegions([...regions, data[0]]);
        setShowNewRegionModal(false);
        setNewRegion({ designation: '', ville: '', adresse: '' });

        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Région ajoutée',
          confirmButtonColor: '#3b82f6',
        });
      }
    } catch (err) {
      console.error('Error adding region:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de l\'ajout',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setActionLoading({ ...actionLoading, 'add': false });
    }
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
                placeholder="Rechercher une région..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchRegions}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Actualiser
            </button>
            <button
              onClick={() => setShowNewRegionModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={20} />
              Nouvelle Région
            </button>
          </div>
        </div>

        {/* Regions Table */}
        {loading && regions.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="animate-spin text-blue-600" size={48} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Désignation</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Ville</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Adresse</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Date de création</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Aucune région trouvée
                    </td>
                  </tr>
                ) : (
                  filteredRegions.map((region) => (
                    <tr key={region.id} className="hover:bg-gray-50 border-b">
                      <td className="px-4 py-3 text-sm text-gray-900">{region.designation}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{region.ville || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{region.adresse || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(region.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => setEditingRegion(region)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Modifier"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteRegion(region)}
                            disabled={actionLoading[`${region.id}-delete`]}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                            title="Supprimer"
                          >
                            {actionLoading[`${region.id}-delete`] ? (
                              <Loader size={18} className="animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
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

      {/* Modal d'édition */}
      {editingRegion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Modifier la région</h2>
              <button
                onClick={() => setEditingRegion(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Désignation *</label>
                <input
                  type="text"
                  value={editingRegion.designation}
                  onChange={(e) => setEditingRegion({ ...editingRegion, designation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                <input
                  type="text"
                  value={editingRegion.ville || ''}
                  onChange={(e) => setEditingRegion({ ...editingRegion, ville: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input
                  type="text"
                  value={editingRegion.adresse || ''}
                  onChange={(e) => setEditingRegion({ ...editingRegion, adresse: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setEditingRegion(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={actionLoading[`${editingRegion.id}-edit`]}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {actionLoading[`${editingRegion.id}-edit`] ? (
                    <Loader size={20} className="animate-spin" />
                  ) : (
                    'Enregistrer'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de création */}
      {showNewRegionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Nouvelle région</h2>
              <button
                onClick={() => setShowNewRegionModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Désignation *</label>
                <input
                  type="text"
                  value={newRegion.designation}
                  onChange={(e) => setNewRegion({ ...newRegion, designation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                <input
                  type="text"
                  value={newRegion.ville}
                  onChange={(e) => setNewRegion({ ...newRegion, ville: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input
                  type="text"
                  value={newRegion.adresse}
                  onChange={(e) => setNewRegion({ ...newRegion, adresse: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setShowNewRegionModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddNewRegion}
                  disabled={actionLoading['add']}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {actionLoading['add'] ? (
                    <Loader size={20} className="animate-spin" />
                  ) : (
                    'Ajouter'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegionPage;
