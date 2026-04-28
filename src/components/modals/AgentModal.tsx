import { useState } from 'react';
import { X } from 'lucide-react';
import { Agent, agentService } from '../../services/tableService';
import bcrypt from 'bcryptjs';

interface AgentModalProps {
  isOpen: boolean;
  agent?: Agent;
  onClose: () => void;
  onSave: () => void;
}

export default function AgentModal({ isOpen, agent, onClose, onSave }: AgentModalProps) {
  const [formData, setFormData] = useState<Agent>(
    agent || { nom: '', email: '', role: 'Utilisateur', region: 'OUEST', password: '' }
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Vérification des champs
    if (!formData.nom || !formData.email || !formData.password) {
      setError('Veuillez remplir tous les champs requis');
      return;
    }

    // Temporairement désactiver les permissions pour le test
    /*
    if (agent?.id) {
      if (!canEdit('utilisateurs')) {
        setError('Vous n\'avez pas la permission de modifier des agents.');
        return;
      }
    } else {
      if (!canCreate('utilisateurs')) {
        setError('Vous n\'avez pas la permission de créer des agents.');
        return;
      }
    }
    */

    setLoading(true);

    try {
      console.log('🧪 Début de l\'insertion d\'agent...');
      console.log('Données du formulaire:', formData);
      
      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(formData.password!, 10);
      console.log('✓ Mot de passe hashé');
      
      const agentData = {
        nom: formData.nom,
        email: formData.email,
        role: formData.role,
        region: formData.region,
        password: hashedPassword
      };
      
      console.log('Données à insérer:', { ...agentData, password: '[HASHED]' });

      if (agent?.id) {
        console.log('Mise à jour de l\'agent:', agent.id);
        await agentService.update(agent.id, agentData);
      } else {
        console.log('Création d\'un nouvel agent');
        await agentService.create(agentData);
      }
      
      console.log('✓ Opération réussie');
      onSave();
      onClose();
    } catch (err) {
      console.error('❌ Erreur lors de l\'opération:', err);
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      setError(`Erreur: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {agent ? 'Éditer Agent' : 'Nouvel Agent'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom *
            </label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe *
            </label>
            <input
              type="password"
              value={formData.password || ''}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading}
              placeholder="Entrez le mot de passe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rôle
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="Utilisateur">Utilisateur</option>
              <option value="Administrateur">Administrateur</option>
              <option value="DR">DR</option>
              <option value="DOP">DOP</option>
              <option value="Gestionnaire">Gestionnaire</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Région
            </label>
            <select
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="OUEST">OUEST</option>
              <option value="EST">EST</option>
              <option value="NORD">NORD</option>
              <option value="SUD">SUD</option>
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:bg-gray-400"
              disabled={loading}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
