import { useState, useEffect, useCallback } from 'react';
import { Edit2, Trash2, Plus, Search, RefreshCw, Loader } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../services/supabase';
import AccessDenied from '../components/AccessDenied';
import { usePermission } from '../hooks/usePermission';

interface BureauDouane {
  id: string;
  designation: string;
  region: string | null;
  mode_transport: string | null;
  created_at: string;
  created_by: string | null;
}

interface ModeTransport {
  id: string;
  designation: string;
  code: string | null;
}

interface NewBureauDouane {
  designation: string;
  region: string;
  mode_transport: string;
}

interface BureauDouanePageProps {
  activeMenu?: string;
  menuTitle?: string;
}

function BureauDouanePage({ menuTitle = 'Bureau Douane' }: BureauDouanePageProps) {
  const { canView, canCreate, canEdit, canDelete } = usePermission();
  const [bureauxDouane, setBureauxDouane] = useState<BureauDouane[]>([]);
  const [filteredBureauxDouane, setFilteredBureauxDouane] = useState<BureauDouane[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingBureauDouane, setEditingBureauDouane] = useState<BureauDouane | null>(null);
  const [showNewBureauDouaneModal, setShowNewBureauDouaneModal] = useState(false);
  const [newBureauDouane, setNewBureauDouane] = useState<NewBureauDouane>({
    designation: '',
    region: '',
    mode_transport: ''
  });
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [modesTransport, setModesTransport] = useState<ModeTransport[]>([]);
  const menuKey = 'parametres-bureau-douane';

  if (!canView(menuKey)) {
    return <AccessDenied />;
  }

  const fetchModesTransport = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('mode_transport')
        .select('*')
        .order('designation', { ascending: true });

      if (error) {
        console.error('Error fetching modes transport:', error);
      } else {
        setModesTransport(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  }, []);

  const fetchBureauxDouane = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bureau_douane')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bureau douane:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Erreur lors du chargement des bureaux de douane',
          confirmButtonColor: '#3b82f6',
        });
      } else {
        setBureauxDouane(data || []);
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

  const filterBureauxDouane = useCallback(() => {
    let filtered = bureauxDouane;

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(b =>
        b.designation.toLowerCase().includes(lower) ||
        (b.region && b.region.toLowerCase().includes(lower))
      );
    }

    filtered.sort((a, b) => a.designation.localeCompare(b.designation));
    setFilteredBureauxDouane(filtered);
  }, [bureauxDouane, searchTerm]);

  useEffect(() => {
    fetchBureauxDouane();
    fetchModesTransport();
  }, [fetchBureauxDouane, fetchModesTransport]);

  useEffect(() => {
    filterBureauxDouane();
  }, [filterBureauxDouane]);

  const handleDeleteBureauDouane = async (bureauDouane: BureauDouane) => {
    Swal.fire({
      title: 'Supprimer ce bureau de douane?',
      text: 'Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#d1d5db',
    }).then(async (result) => {
      if (result.isConfirmed) {
        setActionLoading({ ...actionLoading, [`${bureauDouane.id}-delete`]: true });
        try {
          const { error } = await supabase
            .from('bureau_douane')
            .delete()
            .eq('id', bureauDouane.id);

          if (error) throw error;

          setBureauxDouane(bureauxDouane.filter(b => b.id !== bureauDouane.id));
          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Bureau de douane supprimé',
            confirmButtonColor: '#3b82f6',
          });
        } catch (err) {
          console.error('Error deleting bureau douane:', err);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Erreur lors de la suppression',
            confirmButtonColor: '#3b82f6',
          });
        } finally {
          setActionLoading({ ...actionLoading, [`${bureauDouane.id}-delete`]: false });
        }
      }
    });
  };

  const handleSaveEdit = async () => {
    if (!editingBureauDouane) return;

    setActionLoading({ ...actionLoading, [`${editingBureauDouane.id}-edit`]: true });
    try {
      const { error } = await supabase
        .from('bureau_douane')
        .update({
          designation: editingBureauDouane.designation,
          region: editingBureauDouane.region,
          mode_transport: editingBureauDouane.mode_transport,
        })
        .eq('id', editingBureauDouane.id);

      if (error) throw error;

      setBureauxDouane(bureauxDouane.map(b => b.id === editingBureauDouane.id ? editingBureauDouane : b));
      setEditingBureauDouane(null);
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Bureau de douane mis à jour',
        confirmButtonColor: '#3b82f6',
      });
    } catch (err) {
      console.error('Error updating bureau douane:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de la mise à jour',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setActionLoading({ ...actionLoading, [`${editingBureauDouane.id}-edit`]: false });
    }
  };

  const handleAddNewBureauDouane = async () => {
    if (!newBureauDouane.designation) {
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
        .from('bureau_douane')
        .insert([{
          designation: newBureauDouane.designation,
          region: newBureauDouane.region || null,
          mode_transport: newBureauDouane.mode_transport || null,
        }])
        .select();

      if (error) throw error;

      if (data) {
        setBureauxDouane([...bureauxDouane, data[0]]);
        setShowNewBureauDouaneModal(false);
        setNewBureauDouane({ designation: '', region: '', mode_transport: '' });

        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Bureau de douane ajouté',
          confirmButtonColor: '#3b82f6',
        });
      }
    } catch (err) {
      console.error('Error adding bureau douane:', err);
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
                placeholder="Rechercher un bureau de douane..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchBureauxDouane}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Actualiser
            </button>
            {canCreate(menuKey) && (
              <button
                onClick={() => setShowNewBureauDouaneModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus size={20} />
                Nouveau Bureau Douane
              </button>
            )}
          </div>
        </div>

        {/* Bureaux Douane Table */}
        {loading && bureauxDouane.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="animate-spin text-blue-600" size={48} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Désignation</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Région</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Mode de transport</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Date de création</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBureauxDouane.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Aucun bureau de douane trouvé
                    </td>
                  </tr>
                ) : (
                  filteredBureauxDouane.map((bureauDouane) => (
                    <tr key={bureauDouane.id} className="hover:bg-gray-50 border-b">
                      <td className="px-4 py-3 text-sm text-gray-900">{bureauDouane.designation}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{bureauDouane.region || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{bureauDouane.mode_transport || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(bureauDouane.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          {canEdit(menuKey) && (
                            <button
                              onClick={() => setEditingBureauDouane(bureauDouane)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Modifier"
                            >
                              <Edit2 size={18} />
                            </button>
                          )}
                          {canDelete(menuKey) && (
                            <button
                              onClick={() => handleDeleteBureauDouane(bureauDouane)}
                              disabled={actionLoading[`${bureauDouane.id}-delete`]}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                              title="Supprimer"
                            >
                              {actionLoading[`${bureauDouane.id}-delete`] ? (
                                <Loader size={18} className="animate-spin" />
                              ) : (
                                <Trash2 size={18} />
                              )}
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

      {/* Modal d'édition */}
      {editingBureauDouane && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Modifier le bureau de douane</h2>
              <button
                onClick={() => setEditingBureauDouane(null)}
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
                  value={editingBureauDouane.designation}
                  onChange={(e) => setEditingBureauDouane({ ...editingBureauDouane, designation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Région</label>
                <select
                  value={editingBureauDouane.region || ''}
                  onChange={(e) => setEditingBureauDouane({ ...editingBureauDouane, region: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner une région</option>
                  <option value="Ouest">Ouest</option>
                  <option value="Est">Est</option>
                  <option value="Sud">Sud</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode de transport</label>
                <select
                  value={editingBureauDouane.mode_transport || ''}
                  onChange={(e) => setEditingBureauDouane({ ...editingBureauDouane, mode_transport: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un mode</option>
                  {modesTransport.map((mt) => (
                    <option key={mt.id} value={mt.designation}>
                      {mt.designation}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setEditingBureauDouane(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={actionLoading[`${editingBureauDouane.id}-edit`]}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {actionLoading[`${editingBureauDouane.id}-edit`] ? (
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
      {showNewBureauDouaneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Nouveau bureau de douane</h2>
              <button
                onClick={() => setShowNewBureauDouaneModal(false)}
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
                  value={newBureauDouane.designation}
                  onChange={(e) => setNewBureauDouane({ ...newBureauDouane, designation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Région</label>
                <select
                  value={newBureauDouane.region}
                  onChange={(e) => setNewBureauDouane({ ...newBureauDouane, region: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner une région</option>
                  <option value="Ouest">Ouest</option>
                  <option value="Est">Est</option>
                  <option value="Sud">Sud</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode de transport</label>
                <select
                  value={newBureauDouane.mode_transport}
                  onChange={(e) => setNewBureauDouane({ ...newBureauDouane, mode_transport: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un mode</option>
                  {modesTransport.map((mt) => (
                    <option key={mt.id} value={mt.designation}>
                      {mt.designation}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setShowNewBureauDouaneModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddNewBureauDouane}
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

export default BureauDouanePage;
