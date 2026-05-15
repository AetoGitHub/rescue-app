import type { RescueServiceType } from '~/interfaces/rescue';

export const RESCUE_SERVICE_TYPE_OPTIONS: {
  label: string;
  value: RescueServiceType;
}[] = [
  { label: 'Rescate', value: 'rescue' },
  { label: 'Préstamo', value: 'loan' },
  { label: 'Proyecto', value: 'proyect' },
  { label: 'Presupuesto directo', value: 'direct_budget' },
];
