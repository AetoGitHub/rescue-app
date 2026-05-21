import { describe, expect, it } from 'vitest';
import { parseGoogleMapsUrl } from '~/utils/google-maps-link';

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
