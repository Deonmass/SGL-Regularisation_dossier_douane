import { useState, useEffect, useCallback } from 'react';
import { Edit2, Trash2, Plus, Search, RefreshCw, Loader } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../services/supabase';
import AccessDenied from '../components/AccessDenied';
import { usePermission } from '../hooks/usePermission';

interface Client {
  id: string;
  designation: string;
  created_at: string;
}

interface NewClient {
  designation: string;
}

interface ClientPageProps {
  activeMenu?: string;
  menuTitle?: string;
}

function ClientPage({ menuTitle = 'Clients' }: ClientPageProps) {
  const { canView, canCreate, canEdit, canDelete } = usePermission();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClient, setNewClient] = useState<NewClient>({
    designation: ''
  });
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const menuKey = 'parametres-client';

  if (!canView(menuKey)) {
    return <AccessDenied />;
  }

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('client')
        .select('*')
        .order('designation', { ascending: true });

      if (error) {
        console.error('Error fetching clients:', error);
        setClients([]);
      } else {
        setClients(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const filterClients = useCallback(() => {
    let filtered = clients;

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.designation.toLowerCase().includes(lower)
      );
    }

    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    filterClients();
  }, [filterClients]);

  const handleDeleteClient = (client: Client) => {
    Swal.fire({
      title: 'Supprimer ce client?',
      text: 'Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#d1d5db',
    }).then(async (result) => {
      if (result.isConfirmed) {
        setActionLoading({ ...actionLoading, [`${client.id}-delete`]: true });
        try {
          const { error } = await supabase
            .from('client')
            .delete()
            .eq('id', client.id);

          if (error) throw error;

          setClients(clients.filter(c => c.id !== client.id));
          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Client supprimé',
            confirmButtonColor: '#3b82f6',
          });
        } catch (err) {
          console.error('Error deleting client:', err);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Erreur lors de la suppression',
            confirmButtonColor: '#3b82f6',
          });
        } finally {
          setActionLoading({ ...actionLoading, [`${client.id}-delete`]: false });
        }
      }
    });
  };

  const handleSaveEdit = async () => {
    if (!editingClient) return;

    setActionLoading({ ...actionLoading, [`${editingClient.id}-edit`]: true });
    try {
      const { error } = await supabase
        .from('client')
        .update({
          designation: editingClient.designation,
        })
        .eq('id', editingClient.id);

      if (error) throw error;

      setClients(clients.map(c => c.id === editingClient.id ? editingClient : c));
      setEditingClient(null);
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Client modifié',
        confirmButtonColor: '#3b82f6',
      });
    } catch (err) {
      console.error('Error updating client:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de la mise à jour',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setActionLoading({ ...actionLoading, [`${editingClient.id}-edit`]: false });
    }
  };

  const handleAddNewClient = async () => {
    if (!newClient.designation) {
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
        .from('client')
        .insert([{
          designation: newClient.designation,
        }])
        .select();

      if (error) throw error;

      if (data) {
        setClients([...clients, data[0]]);
        setShowNewClientModal(false);
        setNewClient({ designation: '' });

        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Client ajouté',
          confirmButtonColor: '#3b82f6',
        });
      }
    } catch (err: any) {
      console.error('Error adding client:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err.message || 'Erreur lors de l\'ajout',
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
                placeholder="Rechercher un client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {canCreate(menuKey) && (
              <button
                onClick={() => setShowNewClientModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus size={20} />
                Nouveau client
              </button>
            )}
            <button
              onClick={fetchClients}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Clients Table */}
        {loading && clients.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="animate-spin text-blue-600" size={48} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Désignation</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Date de création</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                      Aucun client trouvé
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50 border-b">
                      <td className="px-4 py-3 text-sm text-gray-900">{client.designation}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(client.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          {canEdit(menuKey) && (
                            <button
                              onClick={() => setEditingClient(client)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Modifier"
                            >
                              <Edit2 size={18} />
                            </button>
                          )}
                          {canDelete(menuKey) && (
                            <button
                              onClick={() => handleDeleteClient(client)}
                              disabled={actionLoading[`${client.id}-delete`]}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                              title="Supprimer"
                            >
                              {actionLoading[`${client.id}-delete`] ? (
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
      {editingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Modifier le client</h2>
              <button
                onClick={() => setEditingClient(null)}
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
                  value={editingClient.designation}
                  onChange={(e) => setEditingClient({ ...editingClient, designation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={actionLoading[`${editingClient.id}-edit`]}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {actionLoading[`${editingClient.id}-edit`] ? (
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
      {showNewClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Nouveau client</h2>
              <button
                onClick={() => setShowNewClientModal(false)}
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
                  value={newClient.designation}
                  onChange={(e) => setNewClient({ ...newClient, designation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setShowNewClientModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddNewClient}
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

export default ClientPage;
