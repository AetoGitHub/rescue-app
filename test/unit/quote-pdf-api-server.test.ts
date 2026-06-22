import { describe, expect, it } from 'vitest';
import {
  buildQuotePdfUpstreamQuery,
  parseQuotePdfRescueId,
  quotePdfAuthorizationHeader,
} from '../../server/utils/quote-pdf-api';

describe('server quote-pdf-api helpers', () => {
  it('parseQuotePdfRescueId accepts positive integers', () => {
    expect(parseQuotePdfRescueId('123')).toBe(123);
    expect(parseQuotePdfRescueId('0')).toBeNull();
    expect(parseQuotePdfRescueId('-1')).toBeNull();
    expect(parseQuotePdfRescueId('abc')).toBeNull();
    expect(parseQuotePdfRescueId(undefined)).toBeNull();
  });

  it('buildQuotePdfUpstreamQuery maps regenerate and download flags', () => {
    expect(buildQuotePdfUpstreamQuery({})).toEqual({});
    expect(buildQuotePdfUpstreamQuery({ regenerate: 'true' })).toEqual({
      regenerate: 'true',
    });
    expect(
      buildQuotePdfUpstreamQuery({ regenerate: true, download: 'true' }),
    ).toEqual({
      regenerate: 'true',
      download: 'true',
    });
  });

  it('quotePdfAuthorizationHeader uses Bearer scheme', () => {
    expect(quotePdfAuthorizationHeader('abc123')).toBe('Bearer abc123');
  });
});
