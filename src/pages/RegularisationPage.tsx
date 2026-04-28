import { useState, useEffect, useCallback } from 'react';
import { Save, X, Loader, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../services/supabase';
import AccessDenied from '../components/AccessDenied';
import { usePermission } from '../hooks/usePermission';

interface Region {
  id: string;
  designation: string;
  ville: string | null;
  adresse: string | null;
}

interface PointEntree {
  id: string;
  designation: string;
  ville: string | null;
  region: string | null;
}

interface BureauDouane {
  id: string;
  designation: string;
  designation_point_entree: string | null;
  mode_transport: string | null;
}

interface ModeTransport {
  id: string;
  designation: string;
  code: string | null;
}

interface RegimeImportation {
  id: string;
  declaration: string;
  type_declaration: string | null;
}

interface Client {
  id: string;
  designation: string;
}

interface NewDossier {
  reference_dossier: string;
  client: string;
  region: string;
  point_entree: string;
  bureau_dedouanement: string;
  regime_importation: string;
  type_declaration: string;
  gestionnaire: string;
  declarant: string;
  memo: string;
  mode_shipment: string;
  reference_shipment: string;
}

interface RegularisationPageProps {
  activeMenu?: string;
  menuTitle?: string;
}

function RegularisationPage({ menuTitle = 'Nouveau Dossier' }: RegularisationPageProps) {
  const { canView, canCreate } = usePermission();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const [pointEntrees, setPointEntrees] = useState<PointEntree[]>([]);
  const [bureauxDouane, setBureauxDouane] = useState<BureauDouane[]>([]);
  const [modesTransport, setModesTransport] = useState<ModeTransport[]>([]);
  const [regimesImportation, setRegimesImportation] = useState<RegimeImportation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [dossier, setDossier] = useState<NewDossier>({
    reference_dossier: '',
    client: '',
    region: '',
    point_entree: '',
    bureau_dedouanement: '',
    regime_importation: '',
    type_declaration: '',
    gestionnaire: '',
    declarant: '',
    memo: '',
    mode_shipment: '',
    reference_shipment: ''
  });
  const menuKey = 'regularisation';

  if (!canView(menuKey)) {
    return <AccessDenied />;
  }

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
      const { data, error } = await supabase
        .from('point_entree')
        .select('*')
        .order('designation', { ascending: true });

      if (error) {
        console.error('Error fetching point entrees:', error);
      } else {
        setPointEntrees(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  }, []);

  const fetchBureauxDouane = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('bureau_douane')
        .select('*')
        .order('designation', { ascending: true });

      if (error) {
        console.error('Error fetching bureau douane:', error);
      } else {
        setBureauxDouane(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  }, []);

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

  const fetchRegimesImportation = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('regime_importation')
        .select('*')
        .order('declaration', { ascending: true });

      if (error) {
        console.error('Error fetching regimes importation:', error);
      } else {
        setRegimesImportation(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('client')
        .select('*')
        .order('designation', { ascending: true });

      if (error) {
        console.error('Error fetching clients:', error);
      } else {
        setClients(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchRegions(), fetchPointEntrees(), fetchBureauxDouane(), fetchModesTransport(), fetchRegimesImportation(), fetchClients()])
      .finally(() => setLoading(false));
  }, [fetchRegions, fetchPointEntrees, fetchBureauxDouane, fetchModesTransport, fetchRegimesImportation, fetchClients]);

  const handleSave = async () => {
    if (!dossier.reference_dossier || !dossier.client) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Veuillez remplir les champs obligatoires (Référence dossier et Client)',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('regularisation_dossier')
        .insert([{
          reference_dossier: dossier.reference_dossier,
          client: dossier.client,
          region: dossier.region || null,
          point_entree: dossier.point_entree || null,
          bureau_dedouanement: dossier.bureau_dedouanement || null,
          regime_importation: dossier.regime_importation || null,
          type_declaration: dossier.type_declaration || null,
          gestionnaire: dossier.gestionnaire || null,
          declarant: dossier.declarant || null,
          memo: dossier.memo || null,
          mode_shipment: dossier.mode_shipment || null,
          reference_shipment: dossier.reference_shipment || null,
        }]);

      if (error) {
        console.error('Error details:', error);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        throw error;
      }

      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Dossier enregistré avec succès',
        confirmButtonColor: '#3b82f6',
      }).then(() => {
        // Reset form
        setDossier({
          reference_dossier: '',
          client: '',
          region: '',
          point_entree: '',
          bureau_dedouanement: '',
          regime_importation: '',
          type_declaration: '',
          gestionnaire: '',
          declarant: '',
          memo: '',
          mode_shipment: '',
          reference_shipment: ''
        });
      });
    } catch (err) {
      console.error('Error saving dossier:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de l\'enregistrement du dossier',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setDossier({
      reference_dossier: '',
      client: '',
      region: '',
      point_entree: '',
      bureau_dedouanement: '',
      regime_importation: '',
      type_declaration: '',
      gestionnaire: '',
      declarant: '',
      memo: '',
      mode_shipment: '',
      reference_shipment: ''
    });
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gray-200 p-2">
        <h1 className="text-2xl font-bold text-gray-900">{menuTitle}</h1>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="animate-spin text-blue-600" size={48} />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Formulaire de Dossier</h2>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  <RefreshCw size={20} />
                  Réinitialiser
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informations générales */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Informations générales</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Référence dossier *</label>
                  <input
                    type="text"
                    value={dossier.reference_dossier}
                    onChange={(e) => setDossier({ ...dossier, reference_dossier: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="CCI2025010358"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                  <select
                    value={dossier.client}
                    onChange={(e) => setDossier({ ...dossier, client: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.designation}>
                        {client.designation}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Localisation */}
                <div className="md:col-span-2 mt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Localisation</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Région</label>
                  <select
                    value={dossier.region}
                    onChange={(e) => setDossier({ ...dossier, region: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner une région</option>
                    <option value="Ouest">Ouest</option>
                    <option value="Est">Est</option>
                    <option value="Sud">Sud</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Point d'entrée</label>
                  <select
                    value={dossier.point_entree}
                    onChange={(e) => setDossier({ ...dossier, point_entree: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un point d'entrée</option>
                    {pointEntrees.map((pe) => (
                      <option key={pe.id} value={pe.designation}>
                        {pe.designation}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bureau de dédouanement</label>
                  <select
                    value={dossier.bureau_dedouanement}
                    onChange={(e) => setDossier({ ...dossier, bureau_dedouanement: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un bureau de douane</option>
                    {bureauxDouane.map((bd) => (
                      <option key={bd.id} value={bd.designation}>
                        {bd.designation}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type Déclaration</label>
                  <select
                    value={dossier.type_declaration}
                    onChange={(e) => {
                      const selectedRegime = regimesImportation.find(ri => ri.type_declaration === e.target.value);
                      setDossier({
                        ...dossier,
                        type_declaration: e.target.value,
                        regime_importation: selectedRegime?.declaration || ''
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un type</option>
                    {regimesImportation.map((ri) => (
                      <option key={ri.id} value={ri.type_declaration || ''}>
                        {ri.type_declaration}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Régime d'importation</label>
                  <input
                    type="text"
                    value={dossier.regime_importation}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 focus:outline-none"
                    placeholder="Sélectionnez un type de déclaration"
                  />
                </div>

                {/* Personnel */}
                <div className="md:col-span-2 mt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Personnel</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gestionnaire</label>
                  <input
                    type="text"
                    value={dossier.gestionnaire}
                    onChange={(e) => setDossier({ ...dossier, gestionnaire: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nom du gestionnaire"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Déclarant</label>
                  <input
                    type="text"
                    value={dossier.declarant}
                    onChange={(e) => setDossier({ ...dossier, declarant: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nom du déclarant"
                  />
                </div>

                {/* Shipment */}
                <div className="md:col-span-2 mt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Shipment</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mode shipment</label>
                  <select
                    value={dossier.mode_shipment}
                    onChange={(e) => setDossier({ ...dossier, mode_shipment: e.target.value })}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Référence shipment</label>
                  <input
                    type="text"
                    value={dossier.reference_shipment}
                    onChange={(e) => setDossier({ ...dossier, reference_shipment: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Référence du shipment"
                  />
                </div>

                {/* Memo */}
                <div className="md:col-span-2 mt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Mémo</h3>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mémo</label>
                  <textarea
                    value={dossier.memo}
                    onChange={(e) => setDossier({ ...dossier, memo: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Notes ou mémo..."
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  <X size={20} />
                  Annuler
                </button>
                {canCreate(menuKey) && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader size={20} className="animate-spin" />
                    ) : (
                      <Save size={20} />
                    )}
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RegularisationPage;
