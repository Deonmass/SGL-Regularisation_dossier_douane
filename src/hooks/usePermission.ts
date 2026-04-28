import { useAuth } from '../contexts/AuthContext';
import { hasMenuPermission, resolvePermissions } from '../utils/permissions';

export function usePermission() {
  const { agent } = useAuth();

  // Parse des permissions
  const getPermissions = () => {
    return resolvePermissions(agent?.permission, agent?.role);
  };

  // Vérifier une permission spécifique
  const hasPermission = (menu: string, action: string): boolean => {
    const perms = getPermissions();
    return hasMenuPermission(perms, menu, action);
  };

  // Vérifier si l'utilisateur peut voir un menu
  const canView = (menu: string): boolean => {
    return hasPermission(menu, 'voir');
  };

  // Vérifier si l'utilisateur peut créer
  const canCreate = (menu: string): boolean => {
    return hasPermission(menu, 'creer');
  };

  // Vérifier si l'utilisateur peut modifier
  const canEdit = (menu: string): boolean => {
    return hasPermission(menu, 'modifier');
  };

  // Vérifier si l'utilisateur peut supprimer
  const canDelete = (menu: string): boolean => {
    return hasPermission(menu, 'supprimer');
  };

  // Vérifier si l'utilisateur peut valider
  const canValidate = (menu: string): boolean => {
    return hasPermission(menu, 'valider');
  };

  // Vérifier si c'est un validateur DR
  const isValidatorDR = (region?: string): boolean => {
    return hasPermission('factures_pending_dr', 'valider');
  };

  // Vérifier si c'est un validateur DOP
  const isValidatorDOP = (): boolean => {
    return hasPermission('factures_pending_dop', 'valider');
  };

  // Vérifier si l'utilisateur peut rejeter au niveau DR
  const canRejectDR = (): boolean => {
    return hasPermission('factures_pending_dr', 'rejeter');
  };

  // Vérifier si l'utilisateur peut rejeter au niveau DOP
  const canRejectDOP = (): boolean => {
    return hasPermission('factures_pending_dop', 'rejeter');
  };

  // Vérifier si l'utilisateur peut voir les validations DR
  const canViewDR = (): boolean => {
    return hasPermission('factures_pending_dr', 'voir');
  };

  // Vérifier si l'utilisateur peut voir les validations DOP
  const canViewDOP = (): boolean => {
    return hasPermission('factures_pending_dop', 'voir');
  };

  // Vérifier si un onglet de factures est visible selon la région
  const canViewInvoiceTab = (tabId: string): boolean => {
    // D'abord vérifier si l'utilisateur a la permission de voir les factures
    if (!hasPermission('factures', 'voir')) {
      return false;
    }

    // Pour les onglets de validation, vérifier soit la permission "voir" spécifique soit les permissions de validateur
    if (tabId === 'factures-pending') {
      return hasPermission('factures_pending_dr', 'voir') || isValidatorDR(agent?.region || '');
    }
    // Si c'est un onglet DOP, vérifier soit la permission "voir" soit dop_tout
    if (tabId === 'factures-pending-dop') {
      return hasPermission('factures_pending_dop', 'voir') || isValidatorDOP();
    }
    // Les autres onglets sont visibles si l'utilisateur a accès aux factures
    return hasPermission('factures', 'voir');
  };

  // Obtenir toutes les permissions
  const getAllPermissions = () => {
    return getPermissions();
  };

  // Vérifier si l'utilisateur peut marquer une facture comme payée
  const canMarkAsPaid = (): boolean => {
    return hasPermission('factures_payment_order', 'marquer_payee');
  };

  return {
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canValidate,
    isValidatorDR,
    isValidatorDOP,
    canRejectDR,
    canRejectDOP,
    canViewDR,
    canViewDOP,
    canMarkAsPaid,
    canViewInvoiceTab,
    getAllPermissions
  };
}
