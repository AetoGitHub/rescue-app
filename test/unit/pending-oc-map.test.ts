import { describe, expect, it } from 'vitest';
import {
  extractPendingOcKeyFromUrl,
  mapPendingOcResponse,
} from '~/utils/pending-oc-map';

const PENDING_OC_PAYLOAD = {
  contacts: [
    {
      contact_name: 'HOLA',
      id: 34,
      whatsapp_number: '8110101010',
      url: 'https://rescue-app-production-566e.up.railway.app/admin/llenar-oc?key=X0ytlbE-563rUsvfkyi2RpEHChcIo4jtnybra_ZhbJvNYjDUt8b',
    },
    {
      contact_name: 'JOSE ANGEL COLIN',
      id: 35,
      whatsapp_number: '9212616462',
      url: 'https://rescue-app-production-566e.up.railway.app/admin/llenar-oc?key=lzqPm-6SHGabRZ43xVn9a3_uphP3IoOJkbqgN1q0QbrLwPD4Hrs',
    },
  ],
};

describe('extractPendingOcKeyFromUrl', () => {
  it('reads the key query param from the contact url', () => {
    expect(extractPendingOcKeyFromUrl(PENDING_OC_PAYLOAD.contacts[0]!.url)).toBe(
      'X0ytlbE-563rUsvfkyi2RpEHChcIo4jtnybra_ZhbJvNYjDUt8b',
    );
  });

  it('accepts a relative llenar-oc path', () => {
    expect(extractPendingOcKeyFromUrl('/admin/llenar-oc?key=abc')).toBe('abc');
  });

  it('returns empty when the url has no key', () => {
    expect(extractPendingOcKeyFromUrl('https://example.com/admin/llenar-oc')).toBe(
      '',
    );
    expect(extractPendingOcKeyFromUrl('')).toBe('');
  });
});

describe('mapPendingOcResponse', () => {
  it('maps contacts and extracts each llenar-oc key', () => {
    expect(mapPendingOcResponse(PENDING_OC_PAYLOAD)).toEqual({
      contacts: [
        {
          id: 34,
          contact_name: 'HOLA',
          whatsapp_number: '8110101010',
          url: PENDING_OC_PAYLOAD.contacts[0]!.url,
          key: 'X0ytlbE-563rUsvfkyi2RpEHChcIo4jtnybra_ZhbJvNYjDUt8b',
        },
        {
          id: 35,
          contact_name: 'JOSE ANGEL COLIN',
          whatsapp_number: '9212616462',
          url: PENDING_OC_PAYLOAD.contacts[1]!.url,
          key: 'lzqPm-6SHGabRZ43xVn9a3_uphP3IoOJkbqgN1q0QbrLwPD4Hrs',
        },
      ],
    });
  });

  it('returns an empty list when the payload is invalid', () => {
    expect(mapPendingOcResponse(null)).toEqual({ contacts: [] });
    expect(mapPendingOcResponse([])).toEqual({ contacts: [] });
    expect(mapPendingOcResponse({ contacts: [{ contact_name: 'x' }] })).toEqual({
      contacts: [],
    });
  });
});
