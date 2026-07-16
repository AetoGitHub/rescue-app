import {
  accessAdminApp,
  accessAdministrative,
  accessCatalogs,
  accessConfig,
  accessDropdown,
  accessMyBalance,
  accessOperational,
  accessPaymentReceipts,
  accessPayments,
  accessUsers,
  type AdminAbility,
} from '../abilities';

/** Read-only catalogue details used by operational/admin rescue flows. */
function isCatalogueDetailPath(path: string): boolean {
  return path.includes('/detail/');
}

export function abilityForApiPath(path: string): AdminAbility {
  if (path.includes('/dropdown')) return accessDropdown;
  if (path.startsWith('/api/catalogue/') && isCatalogueDetailPath(path)) {
    return accessOperational;
  }
  if (path.startsWith('/api/catalogue/')) return accessCatalogs;
  if (path.startsWith('/api/alegra/')) return accessCatalogs;
  if (path.startsWith('/api/credit/company/')) return accessCatalogs;
  if (path.startsWith('/api/auth/operative/commission/')) return accessConfig;
  if (path.startsWith('/api/auth/user/')) return accessUsers;
  if (path.startsWith('/api/invoicing/')) return accessAdministrative;
  if (path.startsWith('/api/rescue/administrative/')) return accessAdministrative;
  if (path.startsWith('/api/payment/balance/')) return accessMyBalance;
  if (path.startsWith('/api/payment/receipt')) return accessPaymentReceipts;
  if (path.startsWith('/api/payment/')) return accessPayments;
  if (path.startsWith('/api/sla/')) return accessConfig;
  if (path.startsWith('/api/rescue/')) return accessOperational;
  return accessAdminApp;
}
