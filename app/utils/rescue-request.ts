import type { StepperItem } from '@nuxt/ui';
import type { RescueServiceType } from '~/interfaces/rescue';

export type RescueWizardStepKind =
  | 'basics'
  | 'quote'
  | 'location'
  | 'supplier'
  | 'summary';

/** Quote is optional only for rescue and proyect; required for loan and direct_budget. */
export function isQuoteOptionalForServiceType(
  serviceType: RescueServiceType,
): boolean {
  return serviceType === 'rescue' || serviceType === 'proyect';
}

function quoteStepItemFor(serviceType: RescueServiceType): StepperItem {
  return {
    title: 'Cotización',
    description: isQuoteOptionalForServiceType(serviceType)
      ? 'Opcional'
      : 'Servicios y precios',
    icon: 'i-lucide-calculator',
    value: 0,
  };
}

export function getWizardStepKind(
  stepIndex: number,
  _serviceType: RescueServiceType,
): RescueWizardStepKind {
  if (stepIndex === 0) return 'basics';
  if (stepIndex === 1) return 'location';
  if (stepIndex === 2) return 'supplier';
  if (stepIndex === 3) return 'quote';
  return 'summary';
}

export function getRescueStepItems(
  serviceType: RescueServiceType,
): StepperItem[] {
  return [
    {
      title: 'Datos',
      description: 'Tipo y cliente',
      icon: 'i-lucide-clipboard-list',
      value: 0,
    },
    {
      title: 'Ubicación',
      description: 'Opcional',
      icon: 'i-lucide-map-pin',
      value: 1,
    },
    {
      title: 'Proveedor',
      description: 'Opcional',
      icon: 'i-lucide-truck',
      value: 2,
    },
    { ...quoteStepItemFor(serviceType), value: 3 },
    {
      title: 'Resumen',
      description: 'Confirmar',
      icon: 'i-lucide-check-circle',
      value: 4,
    },
  ];
}

export function getRescueStepCount(serviceType: RescueServiceType): number {
  return getRescueStepItems(serviceType).length;
}
