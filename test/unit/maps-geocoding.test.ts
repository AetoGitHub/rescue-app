import { describe, expect, it } from 'vitest';
import {
  isValidGeocodingCoordinate,
  isValidGeocodingLatLng,
  parseGeocodingCoordinateString,
  readGeocodingLatLng,
} from '~/utils/maps-geocoding';

describe('maps-geocoding helpers', () => {
  it('parseGeocodingCoordinateString parses numeric strings', () => {
    expect(parseGeocodingCoordinateString('20.5897')).toBe(20.5897);
    expect(parseGeocodingCoordinateString(' -100.3826 ')).toBe(-100.3826);
    expect(parseGeocodingCoordinateString('')).toBeNull();
    expect(parseGeocodingCoordinateString(null)).toBeNull();
  });

  it('isValidGeocodingLatLng validates ranges', () => {
    expect(isValidGeocodingLatLng(20.5, -100.3)).toBe(true);
    expect(isValidGeocodingLatLng(91, 0)).toBe(false);
    expect(isValidGeocodingLatLng(0, -181)).toBe(false);
  });

  it('readGeocodingLatLng returns coords when both values are valid', () => {
    expect(readGeocodingLatLng('20.5897', '-100.3826')).toEqual({
      lat: 20.5897,
      lng: -100.3826,
    });
    expect(readGeocodingLatLng('20.5897', '')).toBeNull();
    expect(readGeocodingLatLng('invalid', '-100')).toBeNull();
  });

  it('isValidGeocodingCoordinate rejects non-finite numbers', () => {
    expect(isValidGeocodingCoordinate(1)).toBe(true);
    expect(isValidGeocodingCoordinate(Number.NaN)).toBe(false);
    expect(isValidGeocodingCoordinate('1')).toBe(false);
  });
});
