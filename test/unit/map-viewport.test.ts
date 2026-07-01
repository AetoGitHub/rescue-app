import { describe, expect, it } from 'vitest';
import {
  boundsFromCenter,
  DEFAULT_SUPPLIER_SEARCH_BOUNDS,
  mapViewportToQuery,
} from '../../app/utils/map-viewport';

describe('boundsFromCenter', () => {
  it('creates symmetric bounds around a point', () => {
    const bounds = boundsFromCenter(19.432608, -99.133209, 50);
    expect(bounds.north).toBeGreaterThan(19.432608);
    expect(bounds.south).toBeLessThan(19.432608);
    expect(bounds.east).toBeGreaterThan(-99.133209);
    expect(bounds.west).toBeLessThan(-99.133209);
  });

  it('expands bounds with larger radius', () => {
    const small = boundsFromCenter(19.432608, -99.133209, 10);
    const large = boundsFromCenter(19.432608, -99.133209, 100);
    expect(large.north - large.south).toBeGreaterThan(small.north - small.south);
    expect(large.east - large.west).toBeGreaterThan(small.east - small.west);
  });
});

describe('DEFAULT_SUPPLIER_SEARCH_BOUNDS', () => {
  it('centers around CDMX default map center', () => {
    expect(DEFAULT_SUPPLIER_SEARCH_BOUNDS.north).toBeGreaterThan(19.432608);
    expect(DEFAULT_SUPPLIER_SEARCH_BOUNDS.south).toBeLessThan(19.432608);
  });
});

describe('mapViewportToQuery', () => {
  it('maps bounds and zoom to supplier map query params', () => {
    const query = mapViewportToQuery({
      zoom: 12,
      bounds: {
        north: 19.5123,
        south: 19.3528,
        east: -99.0821,
        west: -99.1845,
      },
    });

    expect(query).toEqual({
      north: 19.5123,
      south: 19.3528,
      east: -99.0821,
      west: -99.1845,
      zoom: 12,
    });
  });
});
