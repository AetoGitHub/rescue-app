import type { RescueServiceType } from '~/interfaces/rescue';

export const RESCUE_SERVICE_TYPE_OPTIONS: {
  label: string;
  description: string;
  value: RescueServiceType;
  icon: string;
}[] = [
  {
    label: 'Rescate',
    description: 'Servicio inmediato',
    value: 'rescue',
    icon: 'i-lucide-truck',
  },
  {
    label: 'Préstamo',
    description: 'Solo clientes con crédito',
    value: 'loan',
    icon: 'i-lucide-landmark',
  },
  {
    label: 'Cotización',
    description: 'Servicio cotizado',
    value: 'direct_budget',
    icon: 'i-lucide-file-text',
  },
  {
    label: 'Proyecto',
    description: 'Servicio extendido, varios días',
    value: 'proyect',
    icon: 'i-lucide-briefcase',
  },
];

export const RESCUE_SUPPLIER_SORT_OPTIONS: {
  label: string;
  value: import('~/interfaces/rescue').RescueSupplierSort;
}[] = [
  { label: 'Distancia', value: 'distance' },
  { label: 'Ranking', value: 'ranking' },
  { label: 'Nombre', value: 'name' },
];
