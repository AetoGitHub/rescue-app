import type { StepperItem } from '@nuxt/ui';
import type { RescueServiceType } from '~/interfaces/rescue';

export type RescueWizardStepKind =
  | 'basics'
  | 'quote'
  | 'location'
  | 'supplier'
  | 'summary';

export function hasExtendedRescueWizardFlow(
  serviceType: RescueServiceType,
): boolean {
  return serviceType === 'rescue' || serviceType === 'proyect';
}

export function isQuoteOptionalForServiceType(
  serviceType: RescueServiceType,
): boolean {
  return hasExtendedRescueWizardFlow(serviceType);
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
  serviceType: RescueServiceType,
): RescueWizardStepKind {
  if (stepIndex === 0) return 'basics';

  if (hasExtendedRescueWizardFlow(serviceType)) {
    if (stepIndex === 1) return 'location';
    if (stepIndex === 2) return 'supplier';
    if (stepIndex === 3) return 'quote';
    return 'summary';
  }

  if (stepIndex === 1) return 'quote';
  return 'summary';
}

export function getRescueStepItems(
  serviceType: RescueServiceType,
): StepperItem[] {
  if (hasExtendedRescueWizardFlow(serviceType)) {
    return [
      {
        title: 'Datos',
        description: 'Tipo y cliente',
        icon: 'i-lucide-clipboard-list',
        value: 0,
      },
      {
        title: 'Ubicación',
        description: 'Unidad en mapa',
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

  return [
    {
      title: 'Datos',
      description: 'Tipo y cliente',
      icon: 'i-lucide-clipboard-list',
      value: 0,
    },
    { ...quoteStepItemFor(serviceType), value: 1 },
    {
      title: 'Resumen',
      description: 'Confirmar',
      icon: 'i-lucide-check-circle',
      value: 2,
    },
  ];
}

export function getRescueStepCount(serviceType: RescueServiceType): number {
  return getRescueStepItems(serviceType).length;
}
