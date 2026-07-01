import { describe, expect, it } from 'vitest';
import { mapViewportToQuery } from '../../app/utils/map-viewport';

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
