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
  });
});
