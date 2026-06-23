import type { NavigationMenuItem } from '@nuxt/ui';
import type { AdminAbility } from '#shared/abilities';
import {
  accessAdministrative,
  accessCatalogs,
  accessConfig,
  accessMyBalance,
  accessOperational,
  accessPaymentReceipts,
  accessPayments,
  accessUsers,
} from '#shared/abilities';

export type AdminNavLinkItem = NavigationMenuItem & {
  ability: AdminAbility;
};

export type AdminNavSection = {
  label: string;
  items: AdminNavLinkItem[];
};

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    label: 'Administración',
    items: [
      {
        label: 'Operacional',
        to: '/admin/operational',
        icon: 'i-lucide-file-text',
        ability: accessOperational,
      },
      {
        label: 'Administrativo',
        to: '/admin/administrativo',
        icon: 'i-lucide-receipt',
        ability: accessAdministrative,
      },
      {
        label: 'Mi saldo',
        to: '/admin/my-balance',
        icon: 'i-lucide-wallet',
        ability: accessMyBalance,
      },
      {
        label: 'Pagar',
        to: '/admin/pagar',
        icon: 'i-lucide-banknote',
        ability: accessPayments,
      },
      {
        label: 'Comprobantes',
        to: '/admin/pagar/recibos',
        icon: 'i-lucide-file-check-2',
        ability: accessPaymentReceipts,
      },
    ],
  },
  {
    label: 'Catálogos',
    items: [
      {
        label: 'Compañías',
        to: '/admin/catalogs/companies',
        icon: 'i-lucide-building',
        ability: accessCatalogs,
      },
      {
        label: 'Clientes',
        to: '/admin/catalogs/clients',
        icon: 'i-lucide-users',
        ability: accessCatalogs,
      },
      {
        label: 'Contratos',
        to: '/admin/catalogs/contracts',
        icon: 'i-lucide-file-text',
        ability: accessCatalogs,
      },
      {
        label: 'Servicios',
        to: '/admin/catalogs/services',
        icon: 'i-lucide-wrench',
        ability: accessCatalogs,
      },
      {
        label: 'Cancelación',
        to: '/admin/catalogs/cancellation-reasons',
        icon: 'i-lucide-ban',
        ability: accessCatalogs,
      },
      {
        label: 'Proveedores',
        to: '/admin/catalogs/suppliers',
        icon: 'i-lucide-truck',
        ability: accessCatalogs,
      },
    ],
  },
  {
    label: 'Configuración',
    items: [
      {
        label: 'Usuarios',
        to: '/admin/users',
        icon: 'i-lucide-users-round',
        ability: accessUsers,
      },
      {
        label: 'Configuración SLA',
        to: '/admin/configuracion/sla',
        icon: 'i-lucide-timer',
        ability: accessConfig,
      },
    ],
  },
];
