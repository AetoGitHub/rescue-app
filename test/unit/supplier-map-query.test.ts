import { describe, expect, it } from 'vitest';
import { buildSupplierMapQuery } from '../../app/utils/supplier-map-query';

const bounds = {
  north: 19.9,
  south: 19.0,
  east: -98.9,
  west: -99.4,
};

describe('buildSupplierMapQuery', () => {
  it('builds required bounds and hash params', () => {
    const query = buildSupplierMapQuery({
      hash: 'session-abc',
      bounds,
    });
    expect(query).toEqual({
      north: '19.9',
      south: '19',
      east: '-98.9',
      west: '-99.4',
      hash: 'session-abc',
    });
  });

  it('includes optional filters and rescue sort params', () => {
    const query = buildSupplierMapQuery({
      hash: 'session-abc',
      bounds,
      name: '  grúa ',
      trustedOnly: true,
      serviceType: 'cranes',
      orderBy: 'distance',
      unitLat: 19.43,
      unitLng: -99.13,
      zoom: 12,
    });
    expect(query).toMatchObject({
      name: 'grúa',
      is_trusted: 'true',
      service_type: 'cranes',
      order_by: 'distance',
      lat: '19.43',
      lng: '-99.13',
      zoom: '12',
    });
  });

  it('omits service_type when all and lat/lng when sort is not distance', () => {
    const query = buildSupplierMapQuery({
      hash: 'session-abc',
      bounds,
      serviceType: 'all',
      orderBy: 'ranking',
      unitLat: 19.43,
      unitLng: -99.13,
    });
    expect(query.service_type).toBeUndefined();
    expect(query.lat).toBeUndefined();
    expect(query.lng).toBeUndefined();
    expect(query.order_by).toBe('ranking');
  });
});
