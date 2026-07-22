import { describe, expect, it } from 'vitest';
import {
  getRescueStepCount,
  getRescueStepItems,
  getWizardStepKind,
  isQuoteOptionalForServiceType,
} from '~/utils/rescue-request';

const FIVE_STEPS = [
  'Datos',
  'Ubicación',
  'Proveedor',
  'Cotización',
  'Resumen',
] as const;

describe('rescue wizard step order', () => {
  it('places quote as last step before summary for rescue', () => {
    expect(getWizardStepKind(0, 'rescue')).toBe('basics');
    expect(getWizardStepKind(1, 'rescue')).toBe('location');
    expect(getWizardStepKind(2, 'rescue')).toBe('supplier');
    expect(getWizardStepKind(3, 'rescue')).toBe('quote');
    expect(getWizardStepKind(4, 'rescue')).toBe('summary');
  });

  it('lists the same five steps for all service types', () => {
    for (const serviceType of [
      'rescue',
      'proyect',
      'loan',
      'direct_budget',
    ] as const) {
      expect(getRescueStepItems(serviceType).map((i) => i.title)).toEqual([
        ...FIVE_STEPS,
      ]);
      expect(getRescueStepCount(serviceType)).toBe(5);
      expect(getWizardStepKind(1, serviceType)).toBe('location');
      expect(getWizardStepKind(2, serviceType)).toBe('supplier');
      expect(getWizardStepKind(3, serviceType)).toBe('quote');
    }
  });

  it('marks location and supplier as optional in the stepper', () => {
    const items = getRescueStepItems('loan');
    expect(items[1]?.description).toBe('Opcional');
    expect(items[2]?.description).toBe('Opcional');
  });

  it('marks quote optional only for rescue and proyect', () => {
    expect(isQuoteOptionalForServiceType('rescue')).toBe(true);
    expect(isQuoteOptionalForServiceType('proyect')).toBe(true);
    expect(isQuoteOptionalForServiceType('loan')).toBe(false);
    expect(isQuoteOptionalForServiceType('direct_budget')).toBe(false);

    expect(getRescueStepItems('rescue')[3]?.description).toBe('Opcional');
    expect(getRescueStepItems('loan')[3]?.description).toBe(
      'Servicios y precios',
    );
  });
});
