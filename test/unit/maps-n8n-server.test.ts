import { describe, expect, it } from 'vitest';
import {
  parseGeocodingLatLng,
  parseMapsUrlBody,
} from '../../server/utils/maps-n8n';

describe('server maps-n8n helpers', () => {
  it('parseGeocodingLatLng validates lat/lng', () => {
    expect(parseGeocodingLatLng(20.5897, -100.3826)).toEqual({
      lat: 20.5897,
      lng: -100.3826,
    });
    expect(parseGeocodingLatLng('20.5897', '-100.3826')).toEqual({
      lat: 20.5897,
      lng: -100.3826,
    });
    expect(parseGeocodingLatLng(100, 0)).toBeNull();
    expect(parseGeocodingLatLng('x', 1)).toBeNull();
  });

  it('parseMapsUrlBody trims and rejects empty values', () => {
    expect(parseMapsUrlBody('  https://maps.app.goo.gl/abc  ')).toBe(
      'https://maps.app.goo.gl/abc',
    );
    expect(parseMapsUrlBody('   ')).toBeNull();
    expect(parseMapsUrlBody(null)).toBeNull();
  });
});
