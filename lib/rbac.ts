export const RBAC_CONFIG = {
  SYSTEM_ADMIN: {
    allowedMenus: ['dashboard', 'sales', 'samples', 'catalog', 'new_order', 'history', 'produksi', 'packing', 'audit', 'users', 'inventory'],
    defaultMenu: 'dashboard',
  },
  OWNER: {
    allowedMenus: ['dashboard', 'sales', 'samples', 'catalog', 'new_order', 'history', 'produksi', 'packing', 'audit', 'users', 'inventory'],
    defaultMenu: 'dashboard',
  },
  ADMIN: {
    allowedMenus: ['dashboard', 'sales', 'samples', 'catalog', 'new_order', 'history', 'inventory'],
    defaultMenu: 'dashboard',
  },
  PRODUCTION: {
    allowedMenus: ['produksi', 'inventory'],
    defaultMenu: 'produksi',
  },
  PACKING: {
    allowedMenus: ['packing'],
    defaultMenu: 'packing',
  },
};

export const hasAccess = (role: string, menuId: string): boolean => {
  const normalizedRole = role || 'ADMIN';
  const config = RBAC_CONFIG[normalizedRole as keyof typeof RBAC_CONFIG];
  if (!config) return false;
  return config.allowedMenus.includes(menuId);
};

export const getDefaultMenu = (role: string): string => {
  const normalizedRole = role || 'ADMIN';
  const config = RBAC_CONFIG[normalizedRole as keyof typeof RBAC_CONFIG];
  if (!config) return 'dashboard';
  return config.defaultMenu;
};
