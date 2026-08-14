import { describe, expect, it } from 'vitest';
import { FILL_OC_MOCK_KEY } from '~/constants/fill-oc-api';
import { getFillOcMockListResult } from '~/mocks/fill-oc';

describe('getFillOcMockListResult', () => {
  it('returns sample folios for the list key', () => {
    const result = getFillOcMockListResult(FILL_OC_MOCK_KEY.list);
    expect(result.errorStatus).toBeNull();
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0]).toMatchObject({
      folio: 'RES-2026-00012',
      total: '3450.00',
    });
  });

  it('maps unauthorized and empty keys', () => {
    expect(getFillOcMockListResult(FILL_OC_MOCK_KEY.unauthorized).errorStatus).toBe(
      401,
    );
    expect(getFillOcMockListResult(FILL_OC_MOCK_KEY.empty)).toEqual({
      items: [],
      errorStatus: null,
      errorMessage: '',
    });
  });
});
