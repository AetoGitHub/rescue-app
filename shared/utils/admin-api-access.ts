import {
  accessAdminApp,
  accessAdministrative,
  accessCatalogs,
  accessConfig,
  accessMyBalance,
  accessOperational,
  accessPaymentReceipts,
  accessPayments,
  accessUsers,
  type AdminAbility,
} from '../abilities';

export function abilityForApiPath(path: string): AdminAbility {
  if (path.startsWith('/api/catalogue/')) return accessCatalogs;
  if (path.startsWith('/api/auth/operative/commission/')) return accessConfig;
  if (path.startsWith('/api/auth/user/')) return accessUsers;
  if (path.startsWith('/api/rescue/administrative/')) return accessAdministrative;
  if (path.startsWith('/api/payment/balance/')) return accessMyBalance;
  if (path.startsWith('/api/payment/receipt')) return accessPaymentReceipts;
  if (path.startsWith('/api/payment/')) return accessPayments;
  if (path.startsWith('/api/sla/')) return accessConfig;
  if (path.startsWith('/api/rescue/')) return accessOperational;
  return accessAdminApp;
}
