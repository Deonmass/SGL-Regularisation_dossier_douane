import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MoreVertical, Lock, UserX, Edit2, Trash2, RefreshCw, Search, X, Loader, Plus, Shield } from 'lucide-react';
import bcrypt from 'bcryptjs';
import Swal from 'sweetalert2';
import { supabase } from '../services/supabase';
import AccessDenied from '../components/AccessDenied';
import { usePermission } from '../hooks/usePermission';
import { MenuPermissions, PREDEFINED_ROLES, parsePermissionValue } from '../utils/permissions';

interface Agent {
  id: string;
  nom: string;
  email: string;
  role: string;
  region: string;
  statut: string;
  password?: string;
  permission?: string;
  date_creation?: string;
  derniere_connexion?: string | null;
  created_at?: string;
  created_by?: string;
}

interface PermissionSubMenuConfig {
  key: string;
  label: string;
  actions: string[];
}

interface PermissionMenuConfig {
  key: string;
  label: string;
  actions: string[];
  subMenus?: PermissionSubMenuConfig[];
}

interface NewAgent {
  nom: string;
  email: string;
  role: string;
  region: string;
}

interface UsersPageProps {
  activeMenu?: string;
  menuTitle?: string;
}

interface ContextMenuPosition {
  x: number;
  y: number;
}

function UsersPage({ menuTitle = 'Agents' }: UsersPageProps) {
  const { canView, canCreate, canEdit, canDelete, hasPermission } = usePermission();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    agent: Agent;
    position: ContextMenuPosition;
  } | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [resetPassword, setResetPassword] = useState('SGL');
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});  
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newAgent, setNewAgent] = useState<NewAgent>({ nom: '', email: '', role: 'Utilisateur', region: 'OUEST' });
  const [permissionsAgent, setPermissionsAgent] = useState<Agent | null>(null);
  const [activePermissionTab, setActivePermissionTab] = useState('general');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showSaveRoleModal, setShowSaveRoleModal] = useState(false);
  const [roleNameToSave, setRoleNameToSave] = useState('');
  const [selectedRoleTemplate, setSelectedRoleTemplate] = useState<string>('');
  const [permissions, setPermissions] = useState<MenuPermissions>({ ...(PREDEFINED_ROLES['Utilisateur'] || {}) });
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('nom', { ascending: true });

      if (error) throw error;
      
      setAgents(data || []);
    } catch (err) {
      console.error('Error loading agents:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors du chargement des agents',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const filterAgents = useCallback(() => {
    let filtered = agents;

    if (selectedRegion !== 'all') {
      filtered = filtered.filter(a => a.region === selectedRegion);
    }

    if (selectedRoleFilter !== 'all') {
      filtered = filtered.filter(a => a.role === selectedRoleFilter);
    }

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.nom.toLowerCase().includes(lower) || 
        a.email.toLowerCase().includes(lower)
      );
    }

    filtered.sort((a, b) => a.nom.localeCompare(b.nom));
    setFilteredAgents(filtered);
  }, [agents, selectedRegion, selectedRoleFilter, searchTerm]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    filterAgents();
  }, [filterAgents]);

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (role: string): string => {
    const colorMap: Record<string, string> = {
      'Administrateur': '#ef4444',
      'DR': '#3b82f6',
      'DG': '#8b5cf6',
      'DOP': '#f59e0b',
      'Finance': '#06b6d4',
      'Manager': '#10b981',
      'Gestionnaire': '#6366f1',
      'Validateur': '#22c55e',
      'Auditeur': '#a855f7',
      'Utilisateur': '#f97316',
    };
    return colorMap[role] || '#6b7280';
  };

  const getCardColors = (role: string): { borderColor: string; bgColor: string } => {
    const cardColorMap: Record<string, { borderColor: string; bgColor: string }> = {
      'Administrateur': { borderColor: '#ef4444', bgColor: '#fecaca' },
      'DR': { borderColor: '#3b82f6', bgColor: '#bfdbfe' },
      'DG': { borderColor: '#8b5cf6', bgColor: '#d8b4fe' },
      'DOP': { borderColor: '#f59e0b', bgColor: '#fcd34d' },
      'Gestionnaire': { borderColor: '#3b82f6', bgColor: '#bfdbfe' },
      'Validateur': { borderColor: '#22c55e', bgColor: '#bbf7d0' },
      'Auditeur': { borderColor: '#a855f7', bgColor: '#e9d5ff' },
      'Utilisateur': { borderColor: '#f97316', bgColor: '#fed7aa' },
    };
    return cardColorMap[role] || { borderColor: '#6b7280', bgColor: '#e5e7eb' };
  };

  const handleContextMenu = (agent: Agent, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      agent,
      position: { x: e.clientX, y: e.clientY }
    });
  };

  const setActionLoading_ = (agentId: string, action: string, value: boolean) => {
    setActionLoading(prev => ({ ...prev, [`${agentId}-${action}`]: value }));
  };

  const handleShowResetPasswordModal = (agent: Agent) => {
    Swal.fire({
      title: 'Réinitialiser le mot de passe',
      html: `
        <div style="text-align: left;">
          <label style="display: block; font-weight: 500; margin-bottom: 8px; color: #374151;">Nouveau mot de passe:</label>
          <input 
            id="passwordInput" 
            type="text" 
            value="SGL"
            style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-family: monospace; box-sizing: border-box;"
          />
        </div>
      `,
      didOpen: () => {
        const input = document.getElementById('passwordInput') as HTMLInputElement;
        if (input) {
          input.value = resetPassword;
          input.addEventListener('input', (e) => {
            setResetPassword((e.target as HTMLInputElement).value);
          });
        }
      },
      showCancelButton: true,
      confirmButtonText: 'Confirmer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#d1d5db',
    }).then(async (result) => {
      if (result.isConfirmed) {
        await handleResetPasswordConfirm(agent);
      }
    });
  };

  const handleResetPasswordConfirm = async (agent: Agent) => {
    setActionLoading_( agent.id, 'reset', true);
    try {
      // Hash the password using bcryptjs
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(resetPassword, saltRounds);
      
      // Update the password in the database
      const { error } = await supabase
        .from('agents')
        .update({ password: hashedPassword })
        .eq('id', agent.id);

      if (error) throw error;
      
      setAgents(agents.map(a => a.id === agent.id ? { ...a, password: hashedPassword } : a));
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: `Mot de passe réinitialisé à "${resetPassword}"`,
        confirmButtonColor: '#3b82f6',
      });
      setResetPassword('SGL');
    } catch (err) {
      console.error('Error resetting password:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de la réinitialisation',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setActionLoading_( agent.id, 'reset', false);
      setContextMenu(null);
    }
  };

  const handleToggleStatus = async (agent: Agent) => {
    setActionLoading_( agent.id, 'toggle', true);
    try {
      const newStatus = agent.statut === 'Actif' ? 'Inactif' : 'Actif';
      const { error } = await supabase
        .from('agents')
        .update({ statut: newStatus })
        .eq('id', agent.id);

      if (error) throw error;
      
      setAgents(agents.map(a => a.id === agent.id ? { ...a, statut: newStatus } : a));
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: `Compte ${newStatus}`,
        confirmButtonColor: '#3b82f6',
      });
    } catch (err) {
      console.error('Error toggling status:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors du changement de statut',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setActionLoading_( agent.id, 'toggle', false);
      setContextMenu(null);
    }
  };

  const handleDeleteAgent = async (agent: Agent) => {
    Swal.fire({
      title: 'Supprimer cet agent?',
      text: 'Cette action est irréversible. L\'agent et toutes ses données seront supprimés.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#d1d5db',
    }).then(async (result) => {
      if (result.isConfirmed) {
        setActionLoading_( agent.id, 'delete', true);
        try {
          const { error } = await supabase
            .from('agents')
            .delete()
            .eq('id', agent.id);

          if (error) throw error;
          
          setAgents(agents.filter(a => a.id !== agent.id));
          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Agent supprimé',
            confirmButtonColor: '#3b82f6',
          });
        } catch (err) {
          console.error('Error deleting agent:', err);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Erreur lors de la suppression',
            confirmButtonColor: '#3b82f6',
          });
        } finally {
          setActionLoading_( agent.id, 'delete', false);
          setContextMenu(null);
        }
      }
    });
  };

  const handleSaveEdit = async () => {
    if (!editingAgent) return;

    setActionLoading_( editingAgent.id, 'edit', true);
    try {
      const { error } = await supabase
        .from('agents')
        .update({
          nom: editingAgent.nom,
          email: editingAgent.email,
          role: editingAgent.role,
          region: editingAgent.region,
        })
        .eq('id', editingAgent.id);

      if (error) throw error;
      
      setAgents(agents.map(a => a.id === editingAgent.id ? editingAgent : a));
      setEditingAgent(null);
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Agent mis à jour',
        confirmButtonColor: '#3b82f6',
      });
    } catch (err) {
      console.error('Error updating agent:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de la mise à jour',
        confirmButtonColor: '#3b82f6',
      });
        } finally {
          setActionLoading_( editingAgent.id, 'edit', false);
          setContextMenu(null);
        }
      };

  const handleAddNewUser = async () => {
    if (!newAgent.nom || !newAgent.email) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Veuillez remplir tous les champs requis',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setActionLoading_( 'new', 'add', true);
    try {
      // Hash default password
      const hashedPassword = await bcrypt.hash('SGL', 10);
      
      const { data, error: insertError } = await supabase
        .from('agents')
        .insert([{
          nom: newAgent.nom,
          email: newAgent.email,
          role: newAgent.role,
          region: newAgent.region,
          password: hashedPassword,
          statut: 'Actif'
        }])
        .select();

      if (insertError) throw insertError;
      
      if (data) {
        const newAgent_ = data[0];
        setAgents([...agents, newAgent_]);
        setShowNewUserModal(false);
        setNewAgent({ nom: '', email: '', role: 'Utilisateur', region: 'OUEST' });
        
        // Afficher immédiatement le modal de permissions
        setPermissionsAgent(newAgent_);
        setActivePermissionTab('general');
      }
    } catch (err) {
      console.error('Error adding agent:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de l\'ajout de l\'agent',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setActionLoading_( 'new', 'add', false);
    }
  };

  const handleShowPermissionsModal = async (agent: Agent) => {
    try {
      // Toujours récupérer les permissions fraîches depuis la base de données
      const { data, error } = await supabase
        .from('agents')
        .select('permission')
        .eq('id', agent.id)
        .single();
      
      if (error) {
        console.error('Erreur chargement permissions:', error);
        // En cas d'erreur, utiliser les permissions de l'agent si disponibles
        const perms = parsePermissionValue(agent.permission) || PREDEFINED_ROLES[agent.role] || PREDEFINED_ROLES['Utilisateur'] || {};
        setPermissions(perms);
      } else if (data.permission) {
        // Utiliser les permissions depuis la base de données
        const perms = parsePermissionValue(data.permission) || PREDEFINED_ROLES[agent.role] || PREDEFINED_ROLES['Utilisateur'] || {};
        setPermissions(perms);
      } else {
        // Utiliser les permissions par défaut si aucune permission en base
        setPermissions(PREDEFINED_ROLES[agent.role] || PREDEFINED_ROLES['Utilisateur'] || {});
      }
      
      setPermissionsAgent(agent);
      setActivePermissionTab('general');
    } catch (err) {
      console.error('Erreur parsing permissions:', err);
      setPermissions(PREDEFINED_ROLES[agent.role] || PREDEFINED_ROLES['Utilisateur'] || {});
      setPermissionsAgent(agent);
      setActivePermissionTab('general');
    }
  };

  const handleSavePermissions = async () => {
    if (!permissionsAgent) return;

    setActionLoading_( permissionsAgent.id, 'permissions', true);
    try {
      const { error: updateError } = await supabase
        .from('agents')
        .update({ permission: JSON.stringify(permissions) })
        .eq('id', permissionsAgent.id);

      if (updateError) throw updateError;
      
      setAgents(agents.map(a => a.id === permissionsAgent.id ? { ...a, permission: JSON.stringify(permissions) } : a));
      setPermissionsAgent(null);
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Permissions enregistrées',
        confirmButtonColor: '#3b82f6',
      });
    } catch (err) {
      console.error('Error saving permissions:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de l\'enregistrement des permissions',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setActionLoading_( permissionsAgent.id, 'permissions', false);
    }
  };

  const handleSaveRoleAsTemplate = async () => {
    if (!roleNameToSave.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Veuillez entrer un nom pour le rôle',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    try {
      setActionLoading_( 'role', 'save-role', true);
      // Stocker dans localStorage pour la démonstration
      // En production, cela serait stocké en base de données
      const roles = JSON.parse(localStorage.getItem('sgl_custom_roles') || '{}');
      roles[roleNameToSave] = permissions;
      localStorage.setItem('sgl_custom_roles', JSON.stringify(roles));

      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: `Le rôle "${roleNameToSave}" a été enregistré`,
        confirmButtonColor: '#3b82f6',
      });
      
      setShowSaveRoleModal(false);
      setRoleNameToSave('');
    } catch (err) {
      console.error('Error saving role:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de l\'enregistrement du rôle',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setActionLoading_( 'role', 'save-role', false);
    }
  };

  const handleLoadRoleTemplate = (roleName: string) => {
    if (PREDEFINED_ROLES[roleName]) {
      setPermissions(PREDEFINED_ROLES[roleName]);
      setSelectedRoleTemplate(roleName);
    } else {
      // Charger depuis localStorage
      const customRoles = JSON.parse(localStorage.getItem('sgl_custom_roles') || '{}');
      if (customRoles[roleName]) {
        setPermissions(customRoles[roleName]);
        setSelectedRoleTemplate(roleName);
      }
    }
  };

  const handleToggleAdminMode = () => {
    if (isAdminMode) {
      setPermissions(PREDEFINED_ROLES[permissionsAgent?.role || ''] || PREDEFINED_ROLES['Utilisateur'] || {});
    } else {
      setPermissions(PREDEFINED_ROLES['Administrateur'] || {});
    }
    setIsAdminMode(!isAdminMode);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Structure des permissions alignée sur les pages et onglets actuels de l'application
  const menuStructure: PermissionMenuConfig[] = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      actions: ['voir']
    },
    {
      key: 'regularisation',
      label: 'Régularisation',
      actions: ['voir', 'creer', 'modifier', 'supprimer'],
      subMenus: [
        { key: 'regularisation_ouest', label: 'Dossiers OUEST', actions: ['voir', 'modifier', 'supprimer'] },
        { key: 'regularisation_est', label: 'Dossiers EST', actions: ['voir', 'modifier', 'supprimer'] },
        { key: 'regularisation_sud', label: 'Dossiers SUD', actions: ['voir', 'modifier', 'supprimer'] }
      ]
    },
    {
      key: 'parametres',
      label: 'Paramètres',
      actions: ['voir'],
      subMenus: [
        { key: 'regions', label: 'Régions', actions: ['voir', 'creer', 'modifier', 'supprimer'] },
        { key: 'point_entree', label: "Point d'entrée", actions: ['voir', 'creer', 'modifier', 'supprimer'] },
        { key: 'bureau_douane', label: 'Bureau douane', actions: ['voir', 'creer', 'modifier', 'supprimer'] },
        { key: 'mode_transport', label: 'Mode de transport', actions: ['voir', 'creer', 'modifier', 'supprimer'] },
        { key: 'regime_importation', label: "Régime d'importation", actions: ['voir', 'creer', 'modifier', 'supprimer'] },
        { key: 'client', label: 'Client', actions: ['voir', 'creer', 'modifier', 'supprimer'] }
      ]
    },
    {
      key: 'utilisateurs',
      label: 'Utilisateurs',
      actions: ['voir', 'creer', 'modifier', 'supprimer', 'reinitialiser_mdp', 'gerer_permissions']
    }
  ];

  const actionLabels: Record<string, string> = {
    voir: 'Voir',
    creer: 'Créer',
    modifier: 'Modifier',
    supprimer: 'Supprimer',
    reinitialiser_mdp: 'Réinitialiser MDP',
    gerer_permissions: 'Gérer permissions'
  };

  // Structure des onglets pour le modal de permissions
  const permissionsTabs = [
    {
      id: 'general',
      label: 'Général',
      menus: ['dashboard']
    },
    {
      id: 'regularisation',
      label: 'Régularisation',
      menus: ['regularisation']
    },
    {
      id: 'parametres',
      label: 'Paramètres',
      menus: ['parametres']
    },
    {
      id: 'utilisateurs',
      label: 'Utilisateurs',
      menus: ['utilisateurs']
    }
  ];

  const regions = ['all', 'OUEST', 'EST', 'SUD'];
  const menuKey = 'users';

  if (!canView(menuKey)) {
    return <AccessDenied />;
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gray-200 p-2">
        <h1 className="text-2xl font-bold text-gray-900">{menuTitle}</h1>
      </div>

      {/* Onglets par région avec recherche et boutons à droite */}
      <div className="bg-gray-200 flex justify-between items-center gap-4 pr-2 pl-2 pt-2 pb-0 border-b border-gray-300 overflow-x-auto sticky top-0 z-40">
        {/* Onglets à gauche */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedRegion('all')}
            className={`px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
              selectedRegion === 'all'
                ? 'bg-white text-black font-bold border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Toutes ({agents.length})
          </button>
          {regions.filter(r => r !== 'all').map(region => (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className={`px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                selectedRegion === region
                ? 'bg-white text-black font-bold border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {region} ({agents.filter(a => a.region === region).length})
          </button>
          ))}
        </div>
        
        {/* Barre de recherche et boutons à droite */}
        <div className="flex items-center gap-2">
          {/* Barre de recherche */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Select de filtrage par rôle */}
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
          >
            <option value="all">Tous les rôles</option>
            {[...new Set(agents.map(a => a.role))].sort().map(role => (
              <option key={role} value={role}>
                {role} ({agents.filter(a => a.role === role).length})
              </option>
            ))}
          </select>
          
          {/* Boutons avec noms et couleurs dégradées */}
          <button
            onClick={fetchAgents}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg transition disabled:opacity-50 text-sm font-medium"
            title="Actualiser"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
          {canCreate(menuKey) && (
            <button 
              onClick={() => setShowNewUserModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-lg transition text-sm font-medium"
              title="Ajouter un agent"
            >
              <Plus size={16} />
              Nouveau
            </button>
          )}
        </div>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="flex items-center justify-center py-12 pr-10 pl-10 ">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm">Chargement des agents...</p>
          </div>
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          Aucun agent trouvé
        </div>
      ) : (
        <div className="pr-4 pl-4 pt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredAgents.map((agent) => {
            const cardColors = getCardColors(agent.role);
            const initials = getInitials(agent.nom);
            return (
              <div
                key={agent.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden flex flex-col text-center h-fit cursor-pointer hover:bg-gradient-to-br hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 hover:text-white group"
              >
                {/* Avatar Circulaire avec image de fond */}
                <div className="pt-6 flex justify-center relative">
                  {/* Image de fond avec effet fondu */}
                  <div className="absolute inset-0 opacity-10">
                    <img 
                      src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop" 
                      alt="Background" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent"></div>
                  </div>
                  
                  <div
                    className="w-24 h-24 rounded-full overflow-hidden shadow-md relative z-10"
                  >
                    <img 
                      src="/images/user.jpeg" 
                      alt={`${agent.nom} avatar`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback: afficher les initiales si l'image ne charge pas
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.style.backgroundColor = cardColors.borderColor;
                          parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-bold text-2xl">${initials}</div>`;
                        }
                      }}
                    />
                  </div>
                  
                  {/* Menu 3 points en haut à droite */}
                  {(hasPermission(menuKey, 'reinitialiser_mdp') ||
                    canEdit(menuKey) ||
                    hasPermission(menuKey, 'gerer_permissions') ||
                    canDelete(menuKey)) && (
                    <button
                      onClick={(e) => handleContextMenu(agent, e)}
                      className="absolute top-2 right-2 p-2 hover:bg-gray-100 rounded-full transition z-10"
                    >
                      <MoreVertical size={18} className="text-gray-600 hover:text-gray-900 transition" />
                    </button>
                  )}
                </div>

                {/* Contenu Principal */}
                <div className="flex-1 px-4 py-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-white transition-colors">{agent.nom}</h3>
                  <p className="text-xs text-gray-500 mb-4 truncate group-hover:text-white/90 transition-colors">{agent.email}</p>

                  {/* Rôle, Région et Statut sur la même ligne */}
                  <div className="flex justify-center items-center gap-2 mb-3 flex-wrap">
                    <span 
                      className="inline-flex px-2 py-1 rounded-md text-xs font-semibold text-white group-hover:bg-white/20 transition-colors"
                      style={{ backgroundColor: cardColors.borderColor }}
                    >
                      {agent.role}
                    </span>
                    <span className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold text-white group-hover:bg-white/20 transition-colors ${
                      agent.region === 'OUEST' ? 'bg-blue-600' :
                      agent.region === 'EST' ? 'bg-green-600' :
                      agent.region === 'SUD' ? 'bg-orange-600' :
                      'bg-purple-600'
                    }`}>
                      {agent.region}
                    </span>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-gray-600 text-white group-hover:bg-white/20 transition-colors">
                      <span className={`w-2 h-2 rounded-full ${agent.statut === 'Actif' ? 'bg-green-400' : 'bg-red-400'}`}></span>
                      <span>{agent.statut}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Menu contextuel */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[200px]"
          style={{
            top: `${Math.min(contextMenu.position.y, window.innerHeight - 300)}px`,
            left: `${Math.min(contextMenu.position.x, window.innerWidth - 250)}px`
          }}
        >
          <div className="border-b border-gray-200 px-3 py-2 bg-gray-50">
            <p className="font-semibold text-gray-900 text-sm">{contextMenu.agent.nom}</p>
          </div>

          {hasPermission(menuKey, 'reinitialiser_mdp') && (
            <button
              onClick={() => {
                handleShowResetPasswordModal(contextMenu.agent);
                setContextMenu(null);
              }}
              disabled={actionLoading[`${contextMenu.agent.id}-reset`]}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 transition text-sm hover:scale-105"
              title="Réinitialiser le mot de passe"
            >
              {actionLoading[`${contextMenu.agent.id}-reset`] ? (
                <Loader size={14} className="animate-spin" />
              ) : (
                <Lock size={14} />
              )}
              <span>Réinitialiser MDP</span>
            </button>
          )}

          {canEdit(menuKey) && (
            <button
              onClick={() => handleToggleStatus(contextMenu.agent)}
              disabled={actionLoading[`${contextMenu.agent.id}-toggle`]}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 transition text-sm hover:scale-105"
              title="Changer le statut"
            >
              {actionLoading[`${contextMenu.agent.id}-toggle`] ? (
                <Loader size={14} className="animate-spin" />
              ) : (
                <UserX size={14} />
              )}
              <span>{contextMenu.agent.statut === 'Actif' ? 'Désactiver' : 'Activer'}</span>
            </button>
          )}

          {canEdit(menuKey) && (
            <button
              onClick={() => {
                setEditingAgent(contextMenu.agent);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 transition text-sm hover:scale-105"
              title="Modifier les informations"
            >
              <Edit2 size={14} />
              <span>Mettre à jour</span>
            </button>
          )}

          {hasPermission(menuKey, 'gerer_permissions') && (
            <button
              onClick={() => {
                handleShowPermissionsModal(contextMenu.agent);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 transition text-sm hover:scale-105"
              title="Gérer les permissions"
            >
              <Shield size={14} />
              <span>Permissions</span>
            </button>
          )}

          {canDelete(menuKey) && <div className="border-t border-gray-200 my-1"></div>}

          {canDelete(menuKey) && (
            <button
              onClick={() => {
                handleDeleteAgent(contextMenu.agent);
                setContextMenu(null);
              }}
              disabled={actionLoading[`${contextMenu.agent.id}-delete`]}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 transition text-sm rounded-b-lg hover:scale-105"
              title="Supprimer l'agent"
            >
              {actionLoading[`${contextMenu.agent.id}-delete`] ? (
                <Loader size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
              <span>Supprimer</span>
            </button>
          )}
        </div>
      )}


      {/* Modal d'édition */}
      {editingAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Modifier l'agent</h2>
              <button onClick={() => setEditingAgent(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={editingAgent.nom}
                  onChange={(e) => setEditingAgent({ ...editingAgent, nom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editingAgent.email}
                  onChange={(e) => setEditingAgent({ ...editingAgent, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select
                  value={editingAgent.role}
                  onChange={(e) => setEditingAgent({ ...editingAgent, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="Administrateur">Administrateur</option>
                  <option value="DR">DR</option>
                  <option value="DG">DG</option>
                  <option value="DOP">DOP</option>
                  <option value="Finance">Finance</option>
                  <option value="Manager">Manager</option>
                  <option value="Gestionnaire">Gestionnaire</option>
                  <option value="Validateur">Validateur</option>
                  <option value="Auditeur">Auditeur</option>
                  <option value="Utilisateur">Utilisateur</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Région</label>
                <select
                  value={editingAgent.region}
                  onChange={(e) => setEditingAgent({ ...editingAgent, region: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="TOUT">TOUT (Accès à toutes les régions)</option>
                  {regions.filter(r => r !== 'all').map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingAgent({ ...editingAgent, statut: editingAgent.statut === 'Actif' ? 'Inactif' : 'Actif' })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      editingAgent.statut === 'Actif' ? 'bg-green-600' : 'bg-red-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        editingAgent.statut === 'Actif' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-sm font-medium ${
                    editingAgent.statut === 'Actif' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {editingAgent.statut}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setEditingAgent(null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition text-sm font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editingAgent && actionLoading[`${editingAgent.id}-edit`]}
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {editingAgent && actionLoading[`${editingAgent.id}-edit`] && (
                  <Loader size={14} className="animate-spin" />
                )}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nouvel Utilisateur */}
      {showNewUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Ajouter un nouvel utilisateur</h2>
              <button onClick={() => setShowNewUserModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={newAgent.nom}
                  onChange={(e) => setNewAgent({ ...newAgent, nom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Entrez le nom"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newAgent.email}
                  onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="email@domaine.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select
                  value={newAgent.role}
                  onChange={(e) => setNewAgent({ ...newAgent, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="Administrateur">Administrateur</option>
                  <option value="DR">DR</option>
                  <option value="DG">DG</option>
                  <option value="DOP">DOP</option>
                  <option value="Finance">Finance</option>
                  <option value="Manager">Manager</option>
                  <option value="Gestionnaire">Gestionnaire</option>
                  <option value="Validateur">Validateur</option>
                  <option value="Auditeur">Auditeur</option>
                  <option value="Utilisateur">Utilisateur</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Région</label>
                <select
                  value={newAgent.region}
                  onChange={(e) => setNewAgent({ ...newAgent, region: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="TOUT">TOUT (Accès à toutes les régions)</option>
                  <option value="OUEST">OUEST</option>
                  <option value="EST">EST</option>
                  <option value="SUD">SUD</option>
                </select>
              </div>

              <p className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
                Le mot de passe par défaut sera: <span className="font-bold">SGL</span>
              </p>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowNewUserModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition text-sm font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleAddNewUser}
                disabled={actionLoading['new-add']}
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading['new-add'] && (
                  <Loader size={14} className="animate-spin" />
                )}
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Permissions */}
      {permissionsAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-gray-900">Permissions - {permissionsAgent.nom}</h2>
              <button onClick={() => setPermissionsAgent(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Onglets */}
            <div className="flex justify-between items-center px-6 pt-4 border-b bg-gray-50">
              <div className="flex gap-2">
                {permissionsTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActivePermissionTab(tab.id)}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                      activePermissionTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              
              {/* Bouton Admin */}
              <button
                onClick={handleToggleAdminMode}
                className={`px-4 py-2 text-sm font-medium transition-colors border rounded-lg ${
                  isAdminMode
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-gray-600 text-white border-gray-600 hover:bg-gray-700'
                }`}
              >
                {isAdminMode ? 'Désactiver Admin' : 'Admin'}
              </button>
            </div>

            {/* Section Rôles prédéfinis */}
            <div className="px-6 py-4 bg-gray-50 border-b flex gap-3 items-center flex-wrap">
              <label className="text-sm font-medium text-gray-700">Charger un rôle:</label>
              <select
                value={selectedRoleTemplate}
                onChange={(e) => handleLoadRoleTemplate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">-- Sélectionner un rôle --</option>
                {Object.keys(PREDEFINED_ROLES).map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
                {JSON.parse(localStorage.getItem('sgl_custom_roles') || '{}') && 
                  Object.keys(JSON.parse(localStorage.getItem('sgl_custom_roles') || '{}')).map(role => (
                    <option key={`custom-${role}`} value={role}>{role} (Custom)</option>
                  ))
                }
              </select>
              <button
                onClick={() => setShowSaveRoleModal(true)}
                className="px-4 py-2 text-sm font-medium bg-green-600 text-white hover:bg-green-700 rounded-lg transition"
              >
                Définir comme rôle
              </button>
            </div>

            {/* Contenu des onglets */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {permissionsTabs.map((tab) => (
                <div
                  key={tab.id}
                  className={activePermissionTab === tab.id ? 'block' : 'hidden'}
                >
                  <div className="space-y-6">
                    {tab.menus && tab.menus.map((menuKey) => {
                        const menu = menuStructure.find(m => m.key === menuKey);
                        if (!menu) return null;

                        return (
                          <div key={menu.key}>
                            {/* Titre du menu */}
                            <div className="mb-4">
                              <h3 className="text-base font-bold text-gray-900 border-l-4 border-blue-600 pl-3">
                                {menu.label}
                              </h3>
                            </div>

                            {/* Tableau à 2 colonnes */}
                            <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                              <table className="w-full">
                                <tbody>
                                  {/* Actions du menu principal */}
                                  {menu.actions.map((action) => (
                                    <tr key={action} className="border-b hover:bg-gray-50">
                                      <td className="px-4 py-3 text-sm font-medium text-gray-900 w-2/3">
                                        {menu.label} - {actionLabels[action]}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-right w-1/3">
                                        <label className="flex items-center justify-end gap-2 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={permissions[menu.key]?.[action] || false}
                                            onChange={(e) => setPermissions({
                                              ...permissions,
                                              [menu.key]: {
                                                ...permissions[menu.key],
                                                [action]: e.target.checked
                                              }
                                            })}
                                            className="w-4 h-4 cursor-pointer"
                                          />
                                        </label>
                                      </td>
                                    </tr>
                                  ))}

                                  {/* Sous-menus */}
                                  {menu.subMenus && menu.subMenus.map((subMenu) => (
                                    <React.Fragment key={subMenu.key}>
                                      {/* Ligne séparatrice pour le sous-menu */}
                                      <tr className="bg-gray-50">
                                        <td colSpan={2} className="px-4 py-2">
                                          <p className="text-sm font-semibold text-gray-700">→ {subMenu.label}</p>
                                        </td>
                                      </tr>
                                      {/* Actions du sous-menu */}
                                      {subMenu.actions.map((action) => (
                                        <tr key={`${subMenu.key}-${action}`} className="border-b hover:bg-gray-50">
                                          <td className="px-4 py-3 pl-12 text-sm text-gray-700 w-2/3">
                                            {actionLabels[action]}
                                          </td>
                                          <td className="px-4 py-3 text-sm text-right w-1/3">
                                            <label className="flex items-center justify-end gap-2 cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={permissions[subMenu.key]?.[action] || false}
                                                onChange={(e) => setPermissions({
                                                  ...permissions,
                                                  [subMenu.key]: {
                                                    ...permissions[subMenu.key],
                                                    [action]: e.target.checked
                                                  }
                                                })}
                                                className="w-4 h-4 cursor-pointer"
                                              />
                                            </label>
                                          </td>
                                        </tr>
                                      ))}
                                    </React.Fragment>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

            {/* Boutons */}
            <div className="flex gap-3 justify-end px-6 py-4 border-t bg-white sticky bottom-0">
              <button
                onClick={() => setPermissionsAgent(null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition text-sm font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={actionLoading[`${permissionsAgent.id}-permissions`]}
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading[`${permissionsAgent.id}-permissions`] && (
                  <Loader size={14} className="animate-spin" />
                )}
                <Shield size={14} />
                Enregistrer les permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sauvegarder le rôle */}
      {showSaveRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Définir comme rôle</h2>
              <button onClick={() => setShowSaveRoleModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du rôle</label>
                <input
                  type="text"
                  value={roleNameToSave}
                  onChange={(e) => setRoleNameToSave(e.target.value)}
                  placeholder="Ex: Responsable Facturation"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <p className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
                Ce rôle pourra être réutilisé pour d'autres agents
              </p>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowSaveRoleModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition text-sm font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveRoleAsTemplate}
                disabled={actionLoading['0-save-role']}
                className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading['0-save-role'] && (
                  <Loader size={14} className="animate-spin" />
                )}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersPage;
