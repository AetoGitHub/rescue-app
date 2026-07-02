import { describe, expect, it } from 'vitest';
import {
  buildAlegraAuthorizationHeader,
  formatAlegraItemDisplay,
  mapAlegraItemToDropdownRow,
  parseAlegraItemId,
  parseAlegraItemsListResponse,
} from '../../server/utils/alegra-api';

describe('alegra-api helpers', () => {
  it('buildAlegraAuthorizationHeader accepts base64 credential', () => {
    expect(buildAlegraAuthorizationHeader('Y2FybG9zOmFiYzEyMw==')).toBe(
      'Basic Y2FybG9zOmFiYzEyMw==',
    );
  });

  it('buildAlegraAuthorizationHeader encodes email:token plaintext', () => {
    const header = buildAlegraAuthorizationHeader('user@example.com:secret-token');
    expect(header).toBe(
      `Basic ${Buffer.from('user@example.com:secret-token').toString('base64')}`,
    );
  });

  it('buildAlegraAuthorizationHeader keeps full Basic header', () => {
    expect(buildAlegraAuthorizationHeader('Basic abc123')).toBe('Basic abc123');
  });

  it('parseAlegraItemId accepts positive integers', () => {
    expect(parseAlegraItemId(12)).toBe(12);
    expect(parseAlegraItemId('34')).toBe(34);
    expect(parseAlegraItemId(0)).toBeNull();
    expect(parseAlegraItemId('abc')).toBeNull();
  });

  it('parseAlegraItemsListResponse reads array or metadata.data', () => {
    expect(parseAlegraItemsListResponse([{ id: 1, name: 'A' }])).toEqual([
      { id: 1, name: 'A' },
    ]);
    expect(
      parseAlegraItemsListResponse({ data: [{ id: 2, name: 'B' }] }),
    ).toEqual([{ id: 2, name: 'B' }]);
    expect(parseAlegraItemsListResponse({})).toEqual([]);
  });

  it('mapAlegraItemToDropdownRow uses name when present', () => {
    expect(mapAlegraItemToDropdownRow({ id: 5, name: 'Grúa' })).toEqual({
      id: 5,
      name: 'Grúa',
    });
  });

  it('mapAlegraItemToDropdownRow falls back to reference or id label', () => {
    expect(mapAlegraItemToDropdownRow({ id: 7, reference: 'REF-007' })).toEqual({
      id: 7,
      name: 'REF-007',
    });
    expect(mapAlegraItemToDropdownRow({ id: 9 })).toEqual({
      id: 9,
      name: 'Ítem #9',
    });
  });

  it('mapAlegraItemToDropdownRow ignores items without id', () => {
    expect(mapAlegraItemToDropdownRow({ name: 'Sin id' })).toBeNull();
  });

  it('formatAlegraItemDisplay exposes name and reference', () => {
    expect(
      formatAlegraItemDisplay({ id: 3, name: 'Servicio', reference: 'SRV-3' }),
    ).toEqual({
      id: 3,
      name: 'Servicio',
      reference: 'SRV-3',
    });
  });

  it('formatAlegraItemDisplay normalizes empty reference to null', () => {
    expect(formatAlegraItemDisplay({ id: 4, name: 'Item', reference: '  ' })).toEqual({
      id: 4,
      name: 'Item',
      reference: null,
    });
  });
});
