import { useState, useEffect, useCallback } from 'react';
import { Edit2, Trash2, Plus, Search, RefreshCw, Loader } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../services/supabase';

interface RegimeImportation {
  id: string;
  declaration: string;
  type_declaration: string | null;
  created_at: string;
}

interface NewRegimeImportation {
  declaration: string;
  type_declaration: string;
}

interface RegimeImportationPageProps {
  activeMenu?: string;
  menuTitle?: string;
}

function RegimeImportationPage({ menuTitle = 'Régimes d\'Importation' }: RegimeImportationPageProps) {
  const [regimesImportation, setRegimesImportation] = useState<RegimeImportation[]>([]);
  const [filteredRegimesImportation, setFilteredRegimesImportation] = useState<RegimeImportation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingRegimeImportation, setEditingRegimeImportation] = useState<RegimeImportation | null>(null);
  const [showNewRegimeImportationModal, setShowNewRegimeImportationModal] = useState(false);
  const [newRegimeImportation, setNewRegimeImportation] = useState<NewRegimeImportation>({
    declaration: '',
    type_declaration: ''
  });
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});

  const fetchRegimesImportation = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('regime_importation')
        .select('*')
        .order('declaration', { ascending: true });

      if (error) {
        console.error('Error fetching regimes importation:', error);
        setRegimesImportation([]);
      } else {
        setRegimesImportation(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setRegimesImportation([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const filterRegimesImportation = useCallback(() => {
    let filtered = regimesImportation;

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.declaration.toLowerCase().includes(lower) ||
        (r.type_declaration && r.type_declaration.toLowerCase().includes(lower))
      );
    }

    setFilteredRegimesImportation(filtered);
  }, [regimesImportation, searchTerm]);

  useEffect(() => {
    fetchRegimesImportation();
  }, [fetchRegimesImportation]);

  useEffect(() => {
    filterRegimesImportation();
  }, [filterRegimesImportation]);

  const handleDeleteRegimeImportation = async (regimeImportation: RegimeImportation) => {
    Swal.fire({
      title: 'Supprimer ce régime d\'importation?',
      text: 'Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#d1d5db',
    }).then(async (result) => {
      if (result.isConfirmed) {
        setActionLoading({ ...actionLoading, [`${regimeImportation.id}-delete`]: true });
        try {
          const { error } = await supabase
            .from('regime_importation')
            .delete()
            .eq('id', regimeImportation.id);

          if (error) throw error;

          setRegimesImportation(regimesImportation.filter(r => r.id !== regimeImportation.id));
          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Régime d\'importation supprimé',
            confirmButtonColor: '#3b82f6',
          });
        } catch (err) {
          console.error('Error deleting regime importation:', err);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Erreur lors de la suppression',
            confirmButtonColor: '#3b82f6',
          });
        } finally {
          setActionLoading({ ...actionLoading, [`${regimeImportation.id}-delete`]: false });
        }
      }
    });
  };

  const handleSaveEdit = async () => {
    if (!editingRegimeImportation) return;

    setActionLoading({ ...actionLoading, [`${editingRegimeImportation.id}-edit`]: true });
    try {
      const { error } = await supabase
        .from('regime_importation')
        .update({
          declaration: editingRegimeImportation.declaration,
          type_declaration: editingRegimeImportation.type_declaration,
        })
        .eq('id', editingRegimeImportation.id);

      if (error) throw error;

      setRegimesImportation(regimesImportation.map(r => r.id === editingRegimeImportation.id ? editingRegimeImportation : r));
      setEditingRegimeImportation(null);
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Régime d\'importation mis à jour',
        confirmButtonColor: '#3b82f6',
      });
    } catch (err) {
      console.error('Error updating regime importation:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de la mise à jour',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setActionLoading({ ...actionLoading, [`${editingRegimeImportation.id}-edit`]: false });
    }
  };

  const handleAddNewRegimeImportation = async () => {
    if (!newRegimeImportation.declaration) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Veuillez remplir le champ déclaration',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setActionLoading({ ...actionLoading, 'add': true });
    try {
      const { data, error } = await supabase
        .from('regime_importation')
        .insert([{
          declaration: newRegimeImportation.declaration,
          type_declaration: newRegimeImportation.type_declaration || null,
        }])
        .select();

      if (error) throw error;

      if (data) {
        setRegimesImportation([...regimesImportation, data[0]]);
        setShowNewRegimeImportationModal(false);
        setNewRegimeImportation({ declaration: '', type_declaration: '' });

        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Régime d\'importation ajouté',
          confirmButtonColor: '#3b82f6',
        });
      }
    } catch (err: any) {
      console.error('Error adding regime importation:', err);
      let errorMessage = 'Erreur lors de l\'ajout';
      if (err?.code === '42P01') {
        errorMessage = 'La table regime_importation n\'existe pas. Veuillez exécuter le script SQL create_regime_importation_table.sql dans Supabase.';
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
                placeholder="Rechercher un régime d'importation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchRegimesImportation}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Actualiser
            </button>
            <button
              onClick={() => setShowNewRegimeImportationModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={20} />
              Nouveau Régime d'Importation
            </button>
          </div>
        </div>

        {/* Regimes Importation Table */}
        {loading && regimesImportation.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="animate-spin text-blue-600" size={48} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Type Déclaration</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Déclaration</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Date de création</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegimesImportation.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      Aucun régime d'importation trouvé
                    </td>
                  </tr>
                ) : (
                  filteredRegimesImportation.map((regimeImportation) => (
                    <tr key={regimeImportation.id} className="hover:bg-gray-50 border-b">
                      <td className="px-4 py-3 text-sm text-gray-600">{regimeImportation.type_declaration || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{regimeImportation.declaration}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(regimeImportation.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => setEditingRegimeImportation(regimeImportation)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Modifier"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteRegimeImportation(regimeImportation)}
                            disabled={actionLoading[`${regimeImportation.id}-delete`]}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                            title="Supprimer"
                          >
                            {actionLoading[`${regimeImportation.id}-delete`] ? (
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
      {editingRegimeImportation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Modifier le régime d'importation</h2>
              <button
                onClick={() => setEditingRegimeImportation(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type Déclaration *</label>
                <input
                  type="text"
                  value={editingRegimeImportation.type_declaration || ''}
                  onChange={(e) => setEditingRegimeImportation({ ...editingRegimeImportation, type_declaration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: IM4, DP9"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Déclaration *</label>
                <input
                  type="text"
                  value={editingRegimeImportation.declaration}
                  onChange={(e) => setEditingRegimeImportation({ ...editingRegimeImportation, declaration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Mise à la Consommation, Demande Préalable 9"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setEditingRegimeImportation(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={actionLoading[`${editingRegimeImportation.id}-edit`]}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {actionLoading[`${editingRegimeImportation.id}-edit`] ? (
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
      {showNewRegimeImportationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Nouveau régime d'importation</h2>
              <button
                onClick={() => setShowNewRegimeImportationModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type Déclaration *</label>
                <input
                  type="text"
                  value={newRegimeImportation.type_declaration}
                  onChange={(e) => setNewRegimeImportation({ ...newRegimeImportation, type_declaration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: IM4, DP9"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Déclaration *</label>
                <input
                  type="text"
                  value={newRegimeImportation.declaration}
                  onChange={(e) => setNewRegimeImportation({ ...newRegimeImportation, declaration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Mise à la Consommation, Demande Préalable 9"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setShowNewRegimeImportationModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddNewRegimeImportation}
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

export default RegimeImportationPage;
