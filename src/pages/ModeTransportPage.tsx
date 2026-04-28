import { useState, useEffect, useCallback } from 'react';
import { Edit2, Trash2, Plus, Search, RefreshCw, Loader } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../services/supabase';
import AccessDenied from '../components/AccessDenied';
import { usePermission } from '../hooks/usePermission';

interface ModeTransport {
  id: string;
  designation: string;
  code: string | null;
  created_at: string;
}

interface NewModeTransport {
  designation: string;
  code: string;
}

interface ModeTransportPageProps {
  activeMenu?: string;
  menuTitle?: string;
}

function ModeTransportPage({ menuTitle = 'Modes de Transport' }: ModeTransportPageProps) {
  const { canView, canCreate, canEdit, canDelete } = usePermission();
  const [modesTransport, setModesTransport] = useState<ModeTransport[]>([]);
  const [filteredModesTransport, setFilteredModesTransport] = useState<ModeTransport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingModeTransport, setEditingModeTransport] = useState<ModeTransport | null>(null);
  const [showNewModeTransportModal, setShowNewModeTransportModal] = useState(false);
  const [newModeTransport, setNewModeTransport] = useState<NewModeTransport>({
    designation: '',
    code: ''
  });
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const menuKey = 'parametres-mode-transport';

  if (!canView(menuKey)) {
    return <AccessDenied />;
  }

  const fetchModesTransport = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mode_transport')
        .select('*')
        .order('designation', { ascending: true });

      if (error) {
        console.error('Error fetching modes transport:', error);
        setModesTransport([]);
      } else {
        setModesTransport(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setModesTransport([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const filterModesTransport = useCallback(() => {
    let filtered = modesTransport;

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.designation.toLowerCase().includes(lower) ||
        (m.code && m.code.toLowerCase().includes(lower))
      );
    }

    setFilteredModesTransport(filtered);
  }, [modesTransport, searchTerm]);

  useEffect(() => {
    fetchModesTransport();
  }, [fetchModesTransport]);

  useEffect(() => {
    filterModesTransport();
  }, [filterModesTransport]);

  const handleDeleteModeTransport = async (modeTransport: ModeTransport) => {
    Swal.fire({
      title: 'Supprimer ce mode de transport?',
      text: 'Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#d1d5db',
    }).then(async (result) => {
      if (result.isConfirmed) {
        setActionLoading({ ...actionLoading, [`${modeTransport.id}-delete`]: true });
        try {
          const { error } = await supabase
            .from('mode_transport')
            .delete()
            .eq('id', modeTransport.id);

          if (error) throw error;

          setModesTransport(modesTransport.filter(m => m.id !== modeTransport.id));
          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Mode de transport supprimé',
            confirmButtonColor: '#3b82f6',
          });
        } catch (err) {
          console.error('Error deleting mode transport:', err);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Erreur lors de la suppression',
            confirmButtonColor: '#3b82f6',
          });
        } finally {
          setActionLoading({ ...actionLoading, [`${modeTransport.id}-delete`]: false });
        }
      }
    });
  };

  const handleSaveEdit = async () => {
    if (!editingModeTransport) return;

    setActionLoading({ ...actionLoading, [`${editingModeTransport.id}-edit`]: true });
    try {
      const { error } = await supabase
        .from('mode_transport')
        .update({
          designation: editingModeTransport.designation,
          code: editingModeTransport.code,
        })
        .eq('id', editingModeTransport.id);

      if (error) throw error;

      setModesTransport(modesTransport.map(m => m.id === editingModeTransport.id ? editingModeTransport : m));
      setEditingModeTransport(null);
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Mode de transport mis à jour',
        confirmButtonColor: '#3b82f6',
      });
    } catch (err) {
      console.error('Error updating mode transport:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de la mise à jour',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setActionLoading({ ...actionLoading, [`${editingModeTransport.id}-edit`]: false });
    }
  };

  const handleAddNewModeTransport = async () => {
    if (!newModeTransport.designation) {
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
        .from('mode_transport')
        .insert([{
          designation: newModeTransport.designation,
          code: newModeTransport.code || null,
        }])
        .select();

      if (error) throw error;

      if (data) {
        setModesTransport([...modesTransport, data[0]]);
        setShowNewModeTransportModal(false);
        setNewModeTransport({ designation: '', code: '' });

        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Mode de transport ajouté',
          confirmButtonColor: '#3b82f6',
        });
      }
    } catch (err: any) {
      console.error('Error adding mode transport:', err);
      let errorMessage = 'Erreur lors de l\'ajout';
      if (err?.code === '42P01') {
        errorMessage = 'La table mode_transport n\'existe pas. Veuillez exécuter le script SQL create_mode_transport_table.sql dans Supabase.';
      }
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: errorMessage,
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
                placeholder="Rechercher un mode de transport..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchModesTransport}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Actualiser
            </button>
            {canCreate(menuKey) && (
              <button
                onClick={() => setShowNewModeTransportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus size={20} />
                Nouveau Mode de Transport
              </button>
            )}
          </div>
        </div>

        {/* Modes Transport Table */}
        {loading && modesTransport.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="animate-spin text-blue-600" size={48} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Désignation</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Code</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Date de création</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredModesTransport.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      Aucun mode de transport trouvé
                    </td>
                  </tr>
                ) : (
                  filteredModesTransport.map((modeTransport) => (
                    <tr key={modeTransport.id} className="hover:bg-gray-50 border-b">
                      <td className="px-4 py-3 text-sm text-gray-900">{modeTransport.designation}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{modeTransport.code || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(modeTransport.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          {canEdit(menuKey) && (
                            <button
                              onClick={() => setEditingModeTransport(modeTransport)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Modifier"
                            >
                              <Edit2 size={18} />
                            </button>
                          )}
                          {canDelete(menuKey) && (
                            <button
                              onClick={() => handleDeleteModeTransport(modeTransport)}
                              disabled={actionLoading[`${modeTransport.id}-delete`]}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                              title="Supprimer"
                            >
                              {actionLoading[`${modeTransport.id}-delete`] ? (
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
      {editingModeTransport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Modifier le mode de transport</h2>
              <button
                onClick={() => setEditingModeTransport(null)}
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
                  value={editingModeTransport.designation}
                  onChange={(e) => setEditingModeTransport({ ...editingModeTransport, designation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  type="text"
                  value={editingModeTransport.code || ''}
                  onChange={(e) => setEditingModeTransport({ ...editingModeTransport, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: MAR, AIR, ROU, FER"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setEditingModeTransport(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={actionLoading[`${editingModeTransport.id}-edit`]}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {actionLoading[`${editingModeTransport.id}-edit`] ? (
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
      {showNewModeTransportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Nouveau mode de transport</h2>
              <button
                onClick={() => setShowNewModeTransportModal(false)}
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
                  value={newModeTransport.designation}
                  onChange={(e) => setNewModeTransport({ ...newModeTransport, designation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  type="text"
                  value={newModeTransport.code}
                  onChange={(e) => setNewModeTransport({ ...newModeTransport, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: MAR, AIR, ROU, FER"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setShowNewModeTransportModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddNewModeTransport}
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

export default ModeTransportPage;
