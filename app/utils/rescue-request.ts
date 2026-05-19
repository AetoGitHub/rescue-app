import type { StepperItem } from '@nuxt/ui';
import type { RescueServiceType } from '~/interfaces/rescue';

export type RescueWizardStepKind =
  | 'basics'
  | 'quote'
  | 'location'
  | 'supplier'
  | 'summary';

const quoteStepItem: StepperItem = {
  title: 'Cotización',
  description: 'Servicios y precios',
  icon: 'i-lucide-calculator',
  value: 1,
};

export function getWizardStepKind(
  stepIndex: number,
  serviceType: RescueServiceType,
): RescueWizardStepKind {
  if (stepIndex === 0) return 'basics';
  if (stepIndex === 1) return 'quote';

  if (serviceType === 'rescue') {
    if (stepIndex === 2) return 'location';
    if (stepIndex === 3) return 'supplier';
    if (stepIndex === 4) return 'summary';
  }

  return 'summary';
}

export function getRescueStepItems(
  serviceType: RescueServiceType,
): StepperItem[] {
  if (serviceType === 'rescue') {
    return [
      {
        title: 'Datos',
        description: 'Tipo y cliente',
        icon: 'i-lucide-clipboard-list',
        value: 0,
      },
      { ...quoteStepItem },
      {
        title: 'Ubicación',
        description: 'Unidad en mapa',
        icon: 'i-lucide-map-pin',
        value: 2,
      },
      {
        title: 'Proveedor',
        description: 'Opcional',
        icon: 'i-lucide-truck',
        value: 3,
      },
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
    { ...quoteStepItem },
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
