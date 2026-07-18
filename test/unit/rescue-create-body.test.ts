import { describe, expect, it } from 'vitest';
import { rescueFormToCreateBody } from '../../app/schemas/rescue-create';

describe('rescueFormToCreateBody', () => {
  it('sends operator instead of manager', () => {
    const body = rescueFormToCreateBody({
      service_type: 'rescue',
      client: 1,
      general_public: false,
      serialNumber: '',
      manager: 42,
      location_latitude: '19.4',
      location_longitude: '-99.1',
      location_description: 'CDMX',
      service_description: '',
      supplier: null,
      internal_notes: '',
      quote_lines: [],
    });

    expect(body.operator).toBe(42);
    expect('manager' in body).toBe(false);
    expect(body.location_latitude).toBe('19.4');
    expect(body.location_longitude).toBe('-99.1');
  });

  it('sends null location for loan and direct_budget', () => {
    for (const service_type of ['loan', 'direct_budget'] as const) {
      const body = rescueFormToCreateBody({
        service_type,
        client: 1,
        general_public: false,
        serialNumber: '',
        manager: 42,
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
});
