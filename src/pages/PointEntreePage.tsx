import { useState, useEffect, useCallback } from 'react';
import { Edit2, Trash2, Plus, Search, RefreshCw, Loader } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../services/supabase';

interface PointEntree {
  id: string;
  designation: string;
  ville: string | null;
  region: string | null;
  created_at: string;
  created_by: string | null;
}

interface Region {
  id: string;
  designation: string;
  ville: string | null;
  adresse: string | null;
}

interface NewPointEntree {
  designation: string;
  ville: string;
  region: string;
}

interface PointEntreePageProps {
  activeMenu?: string;
  menuTitle?: string;
}

function PointEntreePage({ menuTitle = "Point d'entrée" }: PointEntreePageProps) {
  const [pointEntrees, setPointEntrees] = useState<PointEntree[]>([]);
  const [filteredPointEntrees, setFilteredPointEntrees] = useState<PointEntree[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingPointEntree, setEditingPointEntree] = useState<PointEntree | null>(null);
  const [showNewPointEntreeModal, setShowNewPointEntreeModal] = useState(false);
  const [newPointEntree, setNewPointEntree] = useState<NewPointEntree>({
    designation: '',
    ville: '',
    region: ''
  });
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [regions, setRegions] = useState<Region[]>([]);

  const fetchRegions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('region')
        .select('*')
        .order('designation', { ascending: true });

      if (error) {
        console.error('Error fetching regions:', error);
      } else {
        setRegions(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  }, []);

  const fetchPointEntrees = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('point_entree')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching point entrees:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: "Erreur lors du chargement des points d'entrée",
          confirmButtonColor: '#3b82f6',
        });
      } else {
        setPointEntrees(data || []);
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

  const filterPointEntrees = useCallback(() => {
    let filtered = pointEntrees;

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.designation.toLowerCase().includes(lower) ||
        (p.ville && p.ville.toLowerCase().includes(lower)) ||
        (p.region && p.region.toLowerCase().includes(lower))
      );
    }

    filtered.sort((a, b) => a.designation.localeCompare(b.designation));
    setFilteredPointEntrees(filtered);
  }, [pointEntrees, searchTerm]);

  useEffect(() => {
    fetchPointEntrees();
    fetchRegions();
  }, [fetchPointEntrees, fetchRegions]);

  useEffect(() => {
    filterPointEntrees();
  }, [filterPointEntrees]);

  const handleDeletePointEntree = async (pointEntree: PointEntree) => {
    Swal.fire({
      title: "Supprimer ce point d'entrée?",
      text: 'Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#d1d5db',
    }).then(async (result) => {
      if (result.isConfirmed) {
        setActionLoading({ ...actionLoading, [`${pointEntree.id}-delete`]: true });
        try {
          const { error } = await supabase
            .from('point_entree')
            .delete()
            .eq('id', pointEntree.id);

          if (error) throw error;

          setPointEntrees(pointEntrees.filter(p => p.id !== pointEntree.id));
          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: "Point d'entrée supprimé",
            confirmButtonColor: '#3b82f6',
          });
        } catch (err) {
          console.error('Error deleting point entree:', err);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Erreur lors de la suppression',
            confirmButtonColor: '#3b82f6',
          });
        } finally {
          setActionLoading({ ...actionLoading, [`${pointEntree.id}-delete`]: false });
        }
      }
    });
  };

  const handleSaveEdit = async () => {
    if (!editingPointEntree) return;

    setActionLoading({ ...actionLoading, [`${editingPointEntree.id}-edit`]: true });
    try {
      const { error } = await supabase
        .from('point_entree')
        .update({
          designation: editingPointEntree.designation,
          ville: editingPointEntree.ville,
          region: editingPointEntree.region,
        })
        .eq('id', editingPointEntree.id);

      if (error) throw error;

      setPointEntrees(pointEntrees.map(p => p.id === editingPointEntree.id ? editingPointEntree : p));
      setEditingPointEntree(null);
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: "Point d'entrée mis à jour",
        confirmButtonColor: '#3b82f6',
      });
    } catch (err) {
      console.error('Error updating point entree:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de la mise à jour',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setActionLoading({ ...actionLoading, [`${editingPointEntree.id}-edit`]: false });
    }
  };

  const handleAddNewPointEntree = async () => {
    if (!newPointEntree.designation) {
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
        .from('point_entree')
        .insert([{
          designation: newPointEntree.designation,
          ville: newPointEntree.ville || null,
          region: newPointEntree.region || null,
        }])
        .select();

      if (error) throw error;

      if (data) {
        setPointEntrees([...pointEntrees, data[0]]);
        setShowNewPointEntreeModal(false);
        setNewPointEntree({ designation: '', ville: '', region: '' });

        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: "Point d'entrée ajouté",
          confirmButtonColor: '#3b82f6',
        });
      }
    } catch (err) {
      console.error('Error adding point entree:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: "Erreur lors de l'ajout",
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
                placeholder="Rechercher un point d'entrée..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchPointEntrees}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Actualiser
            </button>
            <button
              onClick={() => setShowNewPointEntreeModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={20} />
              Nouveau Point d'entrée
            </button>
          </div>
        </div>

        {/* Point Entrees Table */}
        {loading && pointEntrees.length === 0 ? (
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
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Région</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Date de création</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPointEntrees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Aucun point d'entrée trouvé
                    </td>
                  </tr>
                ) : (
                  filteredPointEntrees.map((pointEntree) => (
                    <tr key={pointEntree.id} className="hover:bg-gray-50 border-b">
                      <td className="px-4 py-3 text-sm text-gray-900">{pointEntree.designation}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{pointEntree.ville || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{pointEntree.region || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(pointEntree.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => setEditingPointEntree(pointEntree)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Modifier"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeletePointEntree(pointEntree)}
                            disabled={actionLoading[`${pointEntree.id}-delete`]}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                            title="Supprimer"
                          >
                            {actionLoading[`${pointEntree.id}-delete`] ? (
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
      {editingPointEntree && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Modifier le point d'entrée</h2>
              <button
                onClick={() => setEditingPointEntree(null)}
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
                  value={editingPointEntree.designation}
                  onChange={(e) => setEditingPointEntree({ ...editingPointEntree, designation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                <input
                  type="text"
                  value={editingPointEntree.ville || ''}
                  onChange={(e) => setEditingPointEntree({ ...editingPointEntree, ville: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Région</label>
                <select
                  value={editingPointEntree.region || ''}
                  onChange={(e) => setEditingPointEntree({ ...editingPointEntree, region: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner une région</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.designation}>
                      {region.designation}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setEditingPointEntree(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={actionLoading[`${editingPointEntree.id}-edit`]}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {actionLoading[`${editingPointEntree.id}-edit`] ? (
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
      {showNewPointEntreeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Nouveau point d'entrée</h2>
              <button
                onClick={() => setShowNewPointEntreeModal(false)}
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
                  value={newPointEntree.designation}
                  onChange={(e) => setNewPointEntree({ ...newPointEntree, designation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                <input
                  type="text"
                  value={newPointEntree.ville}
                  onChange={(e) => setNewPointEntree({ ...newPointEntree, ville: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Région</label>
                <select
                  value={newPointEntree.region}
                  onChange={(e) => setNewPointEntree({ ...newPointEntree, region: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner une région</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.designation}>
                      {region.designation}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setShowNewPointEntreeModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddNewPointEntree}
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

export default PointEntreePage;
