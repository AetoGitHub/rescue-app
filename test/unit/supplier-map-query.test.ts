import { describe, expect, it } from 'vitest';
import { mapCenterFromBounds } from '../../app/utils/map-viewport';
import { buildSupplierMapQuery } from '../../app/utils/supplier-map-query';

const bounds = {
  north: 19.9,
  south: 19.0,
  east: -98.9,
  west: -99.4,
};

describe('mapCenterFromBounds', () => {
  it('returns geographic center of bounds', () => {
    expect(mapCenterFromBounds(bounds)).toEqual({
      lat: 19.45,
      lng: -99.15,
    });
  });
});

describe('buildSupplierMapQuery', () => {
  it('builds required bounds, hash and map center', () => {
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
      lat: '19.45',
      lng: '-99.15',
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
      zoom: 12,
    });
    expect(query).toMatchObject({
      name: 'grúa',
      is_trusted: 'true',
      service_type: 'cranes',
      order_by: 'distance',
      lat: '19.45',
      lng: '-99.15',
      zoom: '12',
    });
  });

  it('omits service_type when all', () => {
    const query = buildSupplierMapQuery({
      hash: 'session-abc',
      bounds,
      serviceType: 'all',
      orderBy: 'ranking',
    });
    expect(query.service_type).toBeUndefined();
    expect(query.lat).toBe('19.45');
    expect(query.lng).toBe('-99.15');
    expect(query.order_by).toBe('ranking');
  });
});
