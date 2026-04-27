import { useState, useEffect } from 'react';
import { Save, X, Loader, RefreshCw, ChevronDown, ChevronRight, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../services/supabase';

interface RegulProvincesData {
  id?: string;
  n_dossier: string;
  client: string;
  date_saisie_ie_ic: string;
  date_soumission_ie_ic_client: string;
  date_validation_ie_ic_client: string;
  date_soumission_ie_ic_drf: string;
  date_validation_ie_ic_drf: string;
  numero_validation: string;
  date_retrait_ie_ic_drf: string;
  date_envoi_province: string;
  date_reception_ie_ic_province: string;
  date_depot_da: string;
  date_validation_da: string;
  date_retrait: string;
  date_soumission_im4: string;
  numero_im4: string;
  date_bulletin: string;
  numero_bulletin: string;
  date_quittance: string;
  montant_bulletin: string;
}

interface RegulProvincesPageProps {
  dossierReference: string;
  dossierClient: string;
  onClose: () => void;
  onSave: () => void;
}

type SectionKey = 'ie_ic' | 'da' | 'im4';

function RegulProvincesPage({ dossierReference, dossierClient, onClose, onSave }: RegulProvincesPageProps) {
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(new Set(['ie_ic']));
  const [regulData, setRegulData] = useState<RegulProvincesData>({
    n_dossier: dossierReference,
    client: dossierClient,
    date_saisie_ie_ic: '',
    date_soumission_ie_ic_client: '',
    date_validation_ie_ic_client: '',
    date_soumission_ie_ic_drf: '',
    date_validation_ie_ic_drf: '',
    numero_validation: '',
    date_retrait_ie_ic_drf: '',
    date_envoi_province: '',
    date_reception_ie_ic_province: '',
    date_depot_da: '',
    date_validation_da: '',
    date_retrait: '',
    date_soumission_im4: '',
    numero_im4: '',
    date_bulletin: '',
    numero_bulletin: '',
    date_quittance: '',
    montant_bulletin: '',
  });

  const sections = [
    { key: 'ie_ic' as SectionKey, title: 'IE/IC', icon: '📋', color: 'blue' },
    { key: 'da' as SectionKey, title: 'DA (Déclaration d\'Arrivée)', icon: '📝', color: 'purple' },
    { key: 'im4' as SectionKey, title: 'IM4', icon: '💳', color: 'emerald' },
  ];

  const toggleSection = (key: SectionKey) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSections(newExpanded);
  };

  const isSectionComplete = (key: SectionKey): boolean => {
    switch (key) {
      case 'ie_ic':
        return !!regulData.date_validation_ie_ic_drf;
      case 'da':
        return !!regulData.date_validation_da;
      case 'im4':
        return !!regulData.date_quittance;
      default:
        return false;
    }
  };

  const getProgress = () => {
    const total = sections.length;
    const completed = sections.filter(s => isSectionComplete(s.key)).length;
    return Math.round((completed / total) * 100);
  };

  useEffect(() => {
    loadExistingRegul();
  }, [dossierReference]);

  const loadExistingRegul = async () => {
    try {
      const { data } = await supabase
        .from('regul_provinces')
        .select('*')
        .eq('n_dossier', dossierReference)
        .single();

      if (data) {
        setRegulData({
          id: data.id,
          n_dossier: data.n_dossier,
          client: data.client,
          date_saisie_ie_ic: data.date_saisie_ie_ic || '',
          date_soumission_ie_ic_client: data.date_soumission_ie_ic_client || '',
          date_validation_ie_ic_client: data.date_validation_ie_ic_client || '',
          date_soumission_ie_ic_drf: data.date_soumission_ie_ic_drf || '',
          date_validation_ie_ic_drf: data.date_validation_ie_ic_drf || '',
          numero_validation: data.numero_validation || '',
          date_retrait_ie_ic_drf: data.date_retrait_ie_ic_drf || '',
          date_envoi_province: data.date_envoi_province || '',
          date_reception_ie_ic_province: data.date_reception_ie_ic_province || '',
          date_depot_da: data.date_depot_da || '',
          date_validation_da: data.date_validation_da || '',
          date_retrait: data.date_retrait || '',
          date_soumission_im4: data.date_soumission_im4 || '',
          numero_im4: data.numero_im4 || '',
          date_bulletin: data.date_bulletin || '',
          numero_bulletin: data.numero_bulletin || '',
          date_quittance: data.date_quittance || '',
          montant_bulletin: data.montant_bulletin?.toString() || '',
        });
      }
    } catch (err) {
      console.error('Error loading regul provinces:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        n_dossier: regulData.n_dossier,
        client: regulData.client,
        date_saisie_ie_ic: regulData.date_saisie_ie_ic || null,
        date_soumission_ie_ic_client: regulData.date_soumission_ie_ic_client || null,
        date_validation_ie_ic_client: regulData.date_validation_ie_ic_client || null,
        date_soumission_ie_ic_drf: regulData.date_soumission_ie_ic_drf || null,
        date_validation_ie_ic_drf: regulData.date_validation_ie_ic_drf || null,
        numero_validation: regulData.numero_validation || null,
        date_retrait_ie_ic_drf: regulData.date_retrait_ie_ic_drf || null,
        date_envoi_province: regulData.date_envoi_province || null,
        date_reception_ie_ic_province: regulData.date_reception_ie_ic_province || null,
        date_depot_da: regulData.date_depot_da || null,
        date_validation_da: regulData.date_validation_da || null,
        date_retrait: regulData.date_retrait || null,
        date_soumission_im4: regulData.date_soumission_im4 || null,
        numero_im4: regulData.numero_im4 || null,
        date_bulletin: regulData.date_bulletin || null,
        numero_bulletin: regulData.numero_bulletin || null,
        date_quittance: regulData.date_quittance || null,
        montant_bulletin: regulData.montant_bulletin ? parseFloat(regulData.montant_bulletin) : null,
      };

      let error;
      if (regulData.id) {
        const result = await supabase
          .from('regul_provinces')
          .update(payload)
          .eq('id', regulData.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('regul_provinces')
          .insert([payload]);
        error = result.error;
      }

      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Régularisation Provinces enregistrée avec succès',
        confirmButtonColor: '#3b82f6',
      }).then(() => {
        onSave();
        onClose();
      });
    } catch (err) {
      console.error('Error saving regul provinces:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de l\'enregistrement',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setRegulData({
      n_dossier: dossierReference,
      client: dossierClient,
      date_saisie_ie_ic: '',
      date_soumission_ie_ic_client: '',
      date_validation_ie_ic_client: '',
      date_soumission_ie_ic_drf: '',
      date_validation_ie_ic_drf: '',
      numero_validation: '',
      date_retrait_ie_ic_drf: '',
      date_envoi_province: '',
      date_reception_ie_ic_province: '',
      date_depot_da: '',
      date_validation_da: '',
      date_retrait: '',
      date_soumission_im4: '',
      numero_im4: '',
      date_bulletin: '',
      numero_bulletin: '',
      date_quittance: '',
      montant_bulletin: '',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Régularisation Provinces - {dossierReference}</h2>
            <p className="text-sm text-gray-500 mt-1">{dossierClient}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progression</span>
              <span className="text-sm font-semibold text-blue-600">{getProgress()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
          </div>

          {/* Accordion Sections */}
          <div className="space-y-3">
            {sections.map((section) => (
              <div key={section.key} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection(section.key)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{section.icon}</span>
                    <span className="font-semibold text-gray-800">{section.title}</span>
                    {isSectionComplete(section.key) && (
                      <CheckCircle size={18} className="text-green-500" />
                    )}
                  </div>
                  {expandedSections.has(section.key) ? (
                    <ChevronDown size={20} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={20} className="text-gray-500" />
                  )}
                </button>
                
                {expandedSections.has(section.key) && (
                  <div className="p-4 bg-white">
                    {section.key === 'ie_ic' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date de saisie IE/IC</label>
                          <input
                            type="date"
                            value={regulData.date_saisie_ie_ic}
                            onChange={(e) => setRegulData({ ...regulData, date_saisie_ie_ic: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date de soumission IE/IC Client</label>
                          <input
                            type="date"
                            value={regulData.date_soumission_ie_ic_client}
                            onChange={(e) => setRegulData({ ...regulData, date_soumission_ie_ic_client: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date de validation IE/IC Client</label>
                          <input
                            type="date"
                            value={regulData.date_validation_ie_ic_client}
                            onChange={(e) => setRegulData({ ...regulData, date_validation_ie_ic_client: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date de soumission IE/IC DRF</label>
                          <input
                            type="date"
                            value={regulData.date_soumission_ie_ic_drf}
                            onChange={(e) => setRegulData({ ...regulData, date_soumission_ie_ic_drf: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date de validation IE/IC DRF</label>
                          <input
                            type="date"
                            value={regulData.date_validation_ie_ic_drf}
                            onChange={(e) => setRegulData({ ...regulData, date_validation_ie_ic_drf: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de validation</label>
                          <input
                            type="text"
                            value={regulData.numero_validation}
                            onChange={(e) => setRegulData({ ...regulData, numero_validation: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date de retrait IE/IC DRF</label>
                          <input
                            type="date"
                            value={regulData.date_retrait_ie_ic_drf}
                            onChange={(e) => setRegulData({ ...regulData, date_retrait_ie_ic_drf: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date d'envoi province</label>
                          <input
                            type="date"
                            value={regulData.date_envoi_province}
                            onChange={(e) => setRegulData({ ...regulData, date_envoi_province: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date de réception IE/IC province</label>
                          <input
                            type="date"
                            value={regulData.date_reception_ie_ic_province}
                            onChange={(e) => setRegulData({ ...regulData, date_reception_ie_ic_province: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {section.key === 'da' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date de dépôt DA</label>
                          <input
                            type="date"
                            value={regulData.date_depot_da}
                            onChange={(e) => setRegulData({ ...regulData, date_depot_da: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date de validation DA</label>
                          <input
                            type="date"
                            value={regulData.date_validation_da}
                            onChange={(e) => setRegulData({ ...regulData, date_validation_da: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date de retrait</label>
                          <input
                            type="date"
                            value={regulData.date_retrait}
                            onChange={(e) => setRegulData({ ...regulData, date_retrait: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {section.key === 'im4' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date de soumission IM4</label>
                          <input
                            type="date"
                            value={regulData.date_soumission_im4}
                            onChange={(e) => setRegulData({ ...regulData, date_soumission_im4: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Numéro IM4</label>
                          <input
                            type="text"
                            value={regulData.numero_im4}
                            onChange={(e) => setRegulData({ ...regulData, numero_im4: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date du bulletin</label>
                          <input
                            type="date"
                            value={regulData.date_bulletin}
                            onChange={(e) => setRegulData({ ...regulData, date_bulletin: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Numéro du bulletin</label>
                          <input
                            type="text"
                            value={regulData.numero_bulletin}
                            onChange={(e) => setRegulData({ ...regulData, numero_bulletin: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date de quittance</label>
                          <input
                            type="date"
                            value={regulData.date_quittance}
                            onChange={(e) => setRegulData({ ...regulData, date_quittance: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Montant du bulletin</label>
                          <input
                            type="number"
                            step="0.01"
                            value={regulData.montant_bulletin}
                            onChange={(e) => setRegulData({ ...regulData, montant_bulletin: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-6 mt-6 border-t">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              <RefreshCw size={20} />
              Réinitialiser
            </button>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegulProvincesPage;
