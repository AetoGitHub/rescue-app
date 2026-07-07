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

export function abilityForAdminPath(path: string): AdminAbility {
  if (path.startsWith('/admin/catalogs')) return accessCatalogs;
  if (path.startsWith('/admin/configuracion')) return accessConfig;
  if (path.startsWith('/admin/users')) return accessUsers;
  if (path.startsWith('/admin/pagar/recibo')) return accessPaymentReceipts;
  if (path.startsWith('/admin/pagar')) return accessPayments;
  if (path.startsWith('/admin/por-facturar')) return accessAdministrative;
  if (path.startsWith('/admin/administrativo')) return accessAdministrative;
  if (path.startsWith('/admin/my-balance')) return accessMyBalance;
  if (path.startsWith('/admin/operational')) return accessOperational;
  if (path.startsWith('/admin/dashboard')) return accessAdministrative;
  return accessAdminApp;
}
