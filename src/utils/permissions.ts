export interface MenuPermissions {
  [menuKey: string]: {
    [action: string]: boolean | undefined;
  };
}

export const PREDEFINED_ROLES: Record<string, MenuPermissions> = {
  Administrateur: {
    dashboard: { voir: true },
    regularisation: { voir: true, creer: true, modifier: true, supprimer: true },
    regularisation_ouest: { voir: true, modifier: true, supprimer: true },
    regularisation_est: { voir: true, modifier: true, supprimer: true },
    regularisation_sud: { voir: true, modifier: true, supprimer: true },
    parametres: { voir: true },
    regions: { voir: true, creer: true, modifier: true, supprimer: true },
    point_entree: { voir: true, creer: true, modifier: true, supprimer: true },
    bureau_douane: { voir: true, creer: true, modifier: true, supprimer: true },
    mode_transport: { voir: true, creer: true, modifier: true, supprimer: true },
    regime_importation: { voir: true, creer: true, modifier: true, supprimer: true },
    client: { voir: true, creer: true, modifier: true, supprimer: true },
    utilisateurs: {
      voir: true,
      creer: true,
      modifier: true,
      supprimer: true,
      reinitialiser_mdp: true,
      gerer_permissions: true,
    },
  },
  Gestionnaire: {
    dashboard: { voir: true },
    regularisation: { voir: true, creer: true, modifier: true, supprimer: false },
    regularisation_ouest: { voir: true, modifier: true, supprimer: false },
    regularisation_est: { voir: true, modifier: true, supprimer: false },
    regularisation_sud: { voir: true, modifier: true, supprimer: false },
    parametres: { voir: true },
    regions: { voir: true, creer: true, modifier: true, supprimer: false },
    point_entree: { voir: true, creer: true, modifier: true, supprimer: false },
    bureau_douane: { voir: true, creer: true, modifier: true, supprimer: false },
    mode_transport: { voir: true, creer: true, modifier: true, supprimer: false },
    regime_importation: { voir: true, creer: true, modifier: true, supprimer: false },
    client: { voir: true, creer: true, modifier: true, supprimer: false },
    utilisateurs: {
      voir: false,
      creer: false,
      modifier: false,
      supprimer: false,
      reinitialiser_mdp: false,
      gerer_permissions: false,
    },
  },
  DR: {
    dashboard: { voir: true },
    regularisation: { voir: true, creer: true, modifier: true, supprimer: false },
    regularisation_ouest: { voir: true, modifier: true, supprimer: false },
    regularisation_est: { voir: true, modifier: true, supprimer: false },
    regularisation_sud: { voir: true, modifier: true, supprimer: false },
    parametres: { voir: false },
    utilisateurs: { voir: false },
  },
  DOP: {
    dashboard: { voir: true },
    regularisation: { voir: true, creer: false, modifier: false, supprimer: false },
    regularisation_ouest: { voir: true, modifier: false, supprimer: false },
    regularisation_est: { voir: true, modifier: false, supprimer: false },
    regularisation_sud: { voir: true, modifier: false, supprimer: false },
    parametres: { voir: false },
    utilisateurs: { voir: false },
  },
  Utilisateur: {
    dashboard: { voir: true },
    regularisation: { voir: true, creer: false, modifier: false, supprimer: false },
    regularisation_ouest: { voir: true, modifier: false, supprimer: false },
    regularisation_est: { voir: true, modifier: false, supprimer: false },
    regularisation_sud: { voir: true, modifier: false, supprimer: false },
    parametres: { voir: false },
    utilisateurs: { voir: false },
  },
};

export const MENU_PERMISSION_MAP: Record<string, string> = {
  dashboard: 'dashboard',
  regularisation: 'regularisation',
  'regularisation-nouveau': 'regularisation',
  'regularisation-ouest': 'regularisation_ouest',
  'regularisation-est': 'regularisation_est',
  'regularisation-sud': 'regularisation_sud',
  parametres: 'parametres',
  'parametres-regions': 'regions',
  'parametres-point-entree': 'point_entree',
  'parametres-bureau-douane': 'bureau_douane',
  'parametres-mode-transport': 'mode_transport',
  'parametres-regime-importation': 'regime_importation',
  'parametres-client': 'client',
  users: 'utilisateurs',
  'parameters-agents': 'utilisateurs',
};

export function getDefaultPermissionsForRole(role?: string | null): MenuPermissions | null {
  if (!role) return null;
  return PREDEFINED_ROLES[role] || null;
}

export function parsePermissionValue(permission: unknown): MenuPermissions | null {
  if (!permission) return null;

  try {
    if (typeof permission === 'string') {
      return JSON.parse(permission) as MenuPermissions;
    }

    if (typeof permission === 'object') {
      return permission as MenuPermissions;
    }
  } catch (error) {
    console.error('Erreur parsing permissions:', error);
  }

  return null;
}

export function resolvePermissions(permission: unknown, role?: string | null): MenuPermissions | null {
  return parsePermissionValue(permission) || getDefaultPermissionsForRole(role);
}

export function getPermissionKey(menu: string): string {
  return MENU_PERMISSION_MAP[menu] || menu;
}

export function hasMenuPermission(
  permissions: MenuPermissions | null,
  menu: string,
  action: string
): boolean {
  if (!permissions) return false;

  const menuKey = getPermissionKey(menu);
  return permissions[menuKey]?.[action] === true;
}
