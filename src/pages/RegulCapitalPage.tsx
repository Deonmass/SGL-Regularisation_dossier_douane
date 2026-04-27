import { useState, useEffect } from 'react';
import { Save, X, Loader, RefreshCw, ChevronDown, ChevronRight, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../services/supabase';

interface RegulCapitalData {
  id?: string;
  n_dossier: string;
  client: string;
  date_obtention_manifeste: string;
  delai_manifeste: string;
  texo_date_soumission: string;
  texo_date_validation: string;
  texo_delai_validation: string;
  texo_ref_numero: string;
  dexo_date_soumission: string;
  dexo_date_validation: string;
  dexo_delai_validation: string;
  dexo_ref_numero: string;
  im4_date_declaration: string;
  im4_number: string;
  im4_date_bulletin: string;
  im4_bulletin_numero: string;
  im4_date_paiement: string;
  im4_date_quittance: string;
  im4_quittance_numero: string;
  im4_date_bae: string;
  im4_bae_number: string;
  delai_dedouanement_dexo: string;
  delai_dedouanement_drd: string;
}

interface RegulCapitalPageProps {
  dossierReference: string;
  dossierClient: string;
  onClose: () => void;
  onSave: () => void;
}

type SectionKey = 'manifeste' | 'texo' | 'dexo' | 'im4' | 'delais';

function RegulCapitalPage({ dossierReference, dossierClient, onClose, onSave }: RegulCapitalPageProps) {
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(new Set(['manifeste']));
  const [regulData, setRegulData] = useState<RegulCapitalData>({
    n_dossier: dossierReference,
    client: dossierClient,
    date_obtention_manifeste: '',
    delai_manifeste: '',
    texo_date_soumission: '',
    texo_date_validation: '',
    texo_delai_validation: '',
    texo_ref_numero: '',
    dexo_date_soumission: '',
    dexo_date_validation: '',
    dexo_delai_validation: '',
    dexo_ref_numero: '',
    im4_date_declaration: '',
    im4_number: '',
    im4_date_bulletin: '',
    im4_bulletin_numero: '',
    im4_date_paiement: '',
    im4_date_quittance: '',
    im4_quittance_numero: '',
    im4_date_bae: '',
    im4_bae_number: '',
    delai_dedouanement_dexo: '',
    delai_dedouanement_drd: '',
  });

  const sections = [
    { key: 'manifeste' as SectionKey, title: 'Manifeste', icon: '📋', color: 'blue' },
    { key: 'texo' as SectionKey, title: 'TEXO', icon: '📝', color: 'purple' },
    { key: 'dexo' as SectionKey, title: 'DEXO', icon: '📄', color: 'indigo' },
    { key: 'im4' as SectionKey, title: 'IM4', icon: '💳', color: 'emerald' },
    { key: 'delais' as SectionKey, title: 'Délais de dédouanement', icon: '⏱️', color: 'orange' },
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
      case 'manifeste':
        return !!regulData.date_obtention_manifeste;
      case 'texo':
        return !!regulData.texo_date_validation;
      case 'dexo':
        return !!regulData.dexo_date_validation;
      case 'im4':
        return !!regulData.im4_date_bae;
      case 'delais':
        return !!regulData.delai_dedouanement_dexo || !!regulData.delai_dedouanement_drd;
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
        .from('regul_capital')
        .select('*')
        .eq('n_dossier', dossierReference)
        .single();

      if (data) {
        setRegulData({
          id: data.id,
          n_dossier: data.n_dossier,
          client: data.client,
          date_obtention_manifeste: data.date_obtention_manifeste || '',
          delai_manifeste: data.delai_manifeste?.toString() || '',
          texo_date_soumission: data.texo_date_soumission || '',
          texo_date_validation: data.texo_date_validation || '',
          texo_delai_validation: data.texo_delai_validation?.toString() || '',
          texo_ref_numero: data.texo_ref_numero || '',
          dexo_date_soumission: data.dexo_date_soumission || '',
          dexo_date_validation: data.dexo_date_validation || '',
          dexo_delai_validation: data.dexo_delai_validation?.toString() || '',
          dexo_ref_numero: data.dexo_ref_numero || '',
          im4_date_declaration: data.im4_date_declaration || '',
          im4_number: data.im4_number || '',
          im4_date_bulletin: data.im4_date_bulletin || '',
          im4_bulletin_numero: data.im4_bulletin_numero || '',
          im4_date_paiement: data.im4_date_paiement || '',
          im4_date_quittance: data.im4_date_quittance || '',
          im4_quittance_numero: data.im4_quittance_numero || '',
          im4_date_bae: data.im4_date_bae || '',
          im4_bae_number: data.im4_bae_number || '',
          delai_dedouanement_dexo: data.delai_dedouanement_dexo?.toString() || '',
          delai_dedouanement_drd: data.delai_dedouanement_drd?.toString() || '',
        });
      }
    } catch (err) {
      console.error('Error loading regul capital:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        n_dossier: regulData.n_dossier,
        client: regulData.client,
        date_obtention_manifeste: regulData.date_obtention_manifeste || null,
        delai_manifeste: regulData.delai_manifeste ? parseInt(regulData.delai_manifeste) : null,
        texo_date_soumission: regulData.texo_date_soumission || null,
        texo_date_validation: regulData.texo_date_validation || null,
        texo_delai_validation: regulData.texo_delai_validation ? parseInt(regulData.texo_delai_validation) : null,
        texo_ref_numero: regulData.texo_ref_numero || null,
        dexo_date_soumission: regulData.dexo_date_soumission || null,
        dexo_date_validation: regulData.dexo_date_validation || null,
        dexo_delai_validation: regulData.dexo_delai_validation ? parseInt(regulData.dexo_delai_validation) : null,
        dexo_ref_numero: regulData.dexo_ref_numero || null,
        im4_date_declaration: regulData.im4_date_declaration || null,
        im4_number: regulData.im4_number || null,
        im4_date_bulletin: regulData.im4_date_bulletin || null,
        im4_bulletin_numero: regulData.im4_bulletin_numero || null,
        im4_date_paiement: regulData.im4_date_paiement || null,
        im4_date_quittance: regulData.im4_date_quittance || null,
        im4_quittance_numero: regulData.im4_quittance_numero || null,
        im4_date_bae: regulData.im4_date_bae || null,
        im4_bae_number: regulData.im4_bae_number || null,
        delai_dedouanement_dexo: regulData.delai_dedouanement_dexo ? parseInt(regulData.delai_dedouanement_dexo) : null,
        delai_dedouanement_drd: regulData.delai_dedouanement_drd ? parseInt(regulData.delai_dedouanement_drd) : null,
      };

      let error;
      if (regulData.id) {
        const result = await supabase
          .from('regul_capital')
          .update(payload)
          .eq('id', regulData.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('regul_capital')
          .insert([payload]);
        error = result.error;
      }

      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Régularisation Capital enregistrée avec succès',
        confirmButtonColor: '#3b82f6',
      }).then(() => {
        onSave();
        onClose();
      });
    } catch (err) {
      console.error('Error saving regul capital:', err);
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
      date_obtention_manifeste: '',
      delai_manifeste: '',
      texo_date_soumission: '',
      texo_date_validation: '',
      texo_delai_validation: '',
      texo_ref_numero: '',
      dexo_date_soumission: '',
      dexo_date_validation: '',
      dexo_delai_validation: '',
      dexo_ref_numero: '',
      im4_date_declaration: '',
      im4_number: '',
      im4_date_bulletin: '',
      im4_bulletin_numero: '',
      im4_date_paiement: '',
      im4_date_quittance: '',
      im4_quittance_numero: '',
      im4_date_bae: '',
      im4_bae_number: '',
      delai_dedouanement_dexo: '',
      delai_dedouanement_drd: '',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Régularisation Capital - {dossierReference}</h2>
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
                    {section.key === 'manifeste' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date d'obtention manifeste</label>
                          <input
                            type="date"
                            value={regulData.date_obtention_manifeste}
                            onChange={(e) => setRegulData({ ...regulData, date_obtention_manifeste: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Délai manifeste (jours)</label>
                          <input
                            type="number"
                            value={regulData.delai_manifeste}
                            onChange={(e) => setRegulData({ ...regulData, delai_manifeste: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {section.key === 'texo' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date de soumission TEXO</label>
                          <input
                            type="date"
                            value={regulData.texo_date_soumission}
                            onChange={(e) => setRegulData({ ...regulData, texo_date_soumission: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date de validation TEXO</label>
                          <input
                            type="date"
                            value={regulData.texo_date_validation}
                            onChange={(e) => setRegulData({ ...regulData, texo_date_validation: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Délai validation TEXO (jours)</label>
                          <input
                            type="number"
                            value={regulData.texo_delai_validation}
                            onChange={(e) => setRegulData({ ...regulData, texo_delai_validation: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Référence numéro TEXO</label>
                          <input
                            type="text"
                            value={regulData.texo_ref_numero}
                            onChange={(e) => setRegulData({ ...regulData, texo_ref_numero: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {section.key === 'dexo' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date de soumission DEXO</label>
                          <input
                            type="date"
                            value={regulData.dexo_date_soumission}
                            onChange={(e) => setRegulData({ ...regulData, dexo_date_soumission: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date de validation DEXO</label>
                          <input
                            type="date"
                            value={regulData.dexo_date_validation}
                            onChange={(e) => setRegulData({ ...regulData, dexo_date_validation: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Délai validation DEXO (jours)</label>
                          <input
                            type="number"
                            value={regulData.dexo_delai_validation}
                            onChange={(e) => setRegulData({ ...regulData, dexo_delai_validation: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Référence numéro DEXO</label>
                          <input
                            type="text"
                            value={regulData.dexo_ref_numero}
                            onChange={(e) => setRegulData({ ...regulData, dexo_ref_numero: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {section.key === 'im4' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date de déclaration IM4</label>
                          <input
                            type="date"
                            value={regulData.im4_date_declaration}
                            onChange={(e) => setRegulData({ ...regulData, im4_date_declaration: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Numéro IM4</label>
                          <input
                            type="text"
                            value={regulData.im4_number}
                            onChange={(e) => setRegulData({ ...regulData, im4_number: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date du bulletin IM4</label>
                          <input
                            type="date"
                            value={regulData.im4_date_bulletin}
                            onChange={(e) => setRegulData({ ...regulData, im4_date_bulletin: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Numéro bulletin IM4</label>
                          <input
                            type="text"
                            value={regulData.im4_bulletin_numero}
                            onChange={(e) => setRegulData({ ...regulData, im4_bulletin_numero: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date de paiement IM4</label>
                          <input
                            type="date"
                            value={regulData.im4_date_paiement}
                            onChange={(e) => setRegulData({ ...regulData, im4_date_paiement: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date de quittance IM4</label>
                          <input
                            type="date"
                            value={regulData.im4_date_quittance}
                            onChange={(e) => setRegulData({ ...regulData, im4_date_quittance: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Numéro quittance IM4</label>
                          <input
                            type="text"
                            value={regulData.im4_quittance_numero}
                            onChange={(e) => setRegulData({ ...regulData, im4_quittance_numero: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date BAE IM4</label>
                          <input
                            type="date"
                            value={regulData.im4_date_bae}
                            onChange={(e) => setRegulData({ ...regulData, im4_date_bae: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Numéro BAE IM4</label>
                          <input
                            type="text"
                            value={regulData.im4_bae_number}
                            onChange={(e) => setRegulData({ ...regulData, im4_bae_number: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {section.key === 'delais' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Délai dédouanement DEXO (jours)</label>
                          <input
                            type="number"
                            value={regulData.delai_dedouanement_dexo}
                            onChange={(e) => setRegulData({ ...regulData, delai_dedouanement_dexo: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Délai dédouanement DRD (jours)</label>
                          <input
                            type="number"
                            value={regulData.delai_dedouanement_drd}
                            onChange={(e) => setRegulData({ ...regulData, delai_dedouanement_drd: e.target.value })}
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

export default RegulCapitalPage;
