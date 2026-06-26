import { describe, expect, it } from 'vitest';
import { mapSupplierRankingSummary } from '~/utils/catalog-detail-map';

describe('mapSupplierRankingSummary', () => {
  it('maps score and rescues_count from detail payload', () => {
    expect(
      mapSupplierRankingSummary({
        score: 4.5,
        rescues_count: 12,
      }),
    ).toEqual({
      score: 4.5,
      rescues_count: 12,
    });
  });

  it('defaults missing values to zero', () => {
    expect(mapSupplierRankingSummary({})).toEqual({
      score: 0,
      rescues_count: 0,
    });
  });
});
