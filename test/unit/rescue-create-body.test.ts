import { describe, expect, it } from 'vitest';
import { rescueFormToCreateBody } from '../../app/schemas/rescue-create';

describe('rescueFormToCreateBody', () => {
  it('sends operator instead of manager', () => {
    const body = rescueFormToCreateBody({
      service_type: 'rescue',
      client: { value: 1, label: 'Cliente' },
      general_public: false,
      serialNumber: '',
      manager: { value: 42, label: 'Gestor' },
      location_latitude: '19.4',
      location_longitude: '-99.1',
      location_description: 'CDMX',
      service_description: '',
      supplier: null,
      internal_notes: '',
      quote_lines: [],
    });

    expect(body.operator).toBe(42);
    expect(body.client).toBe(1);
    expect('manager' in body).toBe(false);
    expect(body.location_latitude).toBe('19.4');
    expect(body.location_longitude).toBe('-99.1');
  });

  it('sends null location when coords are empty for any service type', () => {
    for (const service_type of [
      'rescue',
      'proyect',
      'loan',
      'direct_budget',
    ] as const) {
      const body = rescueFormToCreateBody({
        service_type,
        client: { value: 1, label: 'Cliente' },
        general_public: false,
        serialNumber: '',
        manager: { value: 42, label: 'Gestor' },
        location_latitude: null,
        location_longitude: null,
        location_description: '',
        service_description: '',
        supplier: null,
        internal_notes: '',
        quote_lines: [],
      });

      expect(body.location_latitude).toBeNull();
      expect(body.location_longitude).toBeNull();
    }
  });

  it('sends location coords for loan and direct_budget when provided', () => {
    for (const service_type of ['loan', 'direct_budget'] as const) {
      const body = rescueFormToCreateBody({
        service_type,
        client: { value: 1, label: 'Cliente' },
        general_public: false,
        serialNumber: '',
        manager: { value: 42, label: 'Gestor' },
        location_latitude: '19.4',
        location_longitude: '-99.1',
        location_description: 'CDMX',
        service_description: '',
        supplier: null,
        internal_notes: '',
        quote_lines: [],
      });

      expect(body.location_latitude).toBe('19.4');
      expect(body.location_longitude).toBe('-99.1');
      expect(body.location_description).toBe('CDMX');
    }
  });
});
