import { describe, expect, it } from 'vitest';
import { toSupplierServiceTypes } from '../../app/utils/catalog-detail-map';

describe('toSupplierServiceTypes', () => {
  it('maps array of valid types', () => {
    expect(toSupplierServiceTypes(['cranes', 'mechanics'])).toEqual([
      'cranes',
      'mechanics',
    ]);
  });

  it('deduplicates array values', () => {
    expect(toSupplierServiceTypes(['cranes', 'cranes', 'transport'])).toEqual([
      'cranes',
      'transport',
    ]);
  });

  it('maps legacy single string', () => {
    expect(toSupplierServiceTypes('road_assist')).toEqual(['road_assist']);
  });

  it('falls back to other for invalid values', () => {
    expect(toSupplierServiceTypes('unknown')).toEqual(['other']);
    expect(toSupplierServiceTypes([])).toEqual(['other']);
  });
});
