import { describe, expect, it } from 'vitest';
import { parseRescueCoordinates } from '../../app/utils/operational-rescue-detail';

describe('parseRescueCoordinates', () => {
  it('parses valid coordinates', () => {
    expect(parseRescueCoordinates('19.43', '-99.13')).toEqual({
      lat: 19.43,
      lng: -99.13,
    });
  });

  it('returns null for missing values', () => {
    expect(parseRescueCoordinates(null, null)).toBeNull();
    expect(parseRescueCoordinates('', '')).toBeNull();
    expect(parseRescueCoordinates('19.43', null)).toBeNull();
  });

  it('returns null for 0,0 placeholder', () => {
    expect(parseRescueCoordinates(0, 0)).toBeNull();
    expect(parseRescueCoordinates('0', '0')).toBeNull();
    expect(parseRescueCoordinates('0.0', '0.00')).toBeNull();
  });
});
