import { describe, expect, it } from 'vitest';
import {
  formatLatLngPair,
  parseGoogleMapsUrl,
  parseLatLngPair,
} from '~/utils/google-maps-link';

describe('parseGoogleMapsUrl', () => {
  it('parses @lat,lng from maps url', () => {
    const result = parseGoogleMapsUrl(
      'https://www.google.com/maps/@19.432608,-99.133209,15z',
    );
    expect(result).toEqual({ lat: 19.432608, lng: -99.133209 });
  });

  it('parses !3d!4d pattern', () => {
    const result = parseGoogleMapsUrl(
      'https://www.google.com/maps/place/test/data=!3d25.6866!4d-100.3161',
    );
    expect(result).toEqual({ lat: 25.6866, lng: -100.3161 });
  });

  it('parses q=lat,lng query', () => {
    const result = parseGoogleMapsUrl(
      'https://maps.google.com/?q=19.43,-99.13',
    );
    expect(result?.lat).toBeCloseTo(19.43, 2);
    expect(result?.lng).toBeCloseTo(-99.13, 2);
  });

  it('returns null for invalid url', () => {
    expect(parseGoogleMapsUrl('not-a-map-link')).toBeNull();
    expect(parseGoogleMapsUrl('')).toBeNull();
  });
});

describe('parseLatLngPair', () => {
  it('parses lat, lng with space after comma', () => {
    expect(
      parseLatLngPair('18.0749639676887, -94.32269235997158'),
    ).toEqual({
      lat: 18.0749639676887,
      lng: -94.32269235997158,
    });
  });

  it('parses lat,lng without space', () => {
    expect(parseLatLngPair('19.432608,-99.133209')).toEqual({
      lat: 19.432608,
      lng: -99.133209,
    });
  });

  it('returns null for invalid or incomplete input', () => {
    expect(parseLatLngPair('')).toBeNull();
    expect(parseLatLngPair('18.07')).toBeNull();
    expect(parseLatLngPair('18.07,')).toBeNull();
    expect(parseLatLngPair('91, 0')).toBeNull();
    expect(parseLatLngPair('0, -181')).toBeNull();
  });

  it('formatLatLngPair formats with 6 decimals', () => {
    expect(formatLatLngPair(18.0749639676887, -94.32269235997158)).toBe(
      '18.074964, -94.322692',
    );
  });
});
