import { describe, expect, it } from 'vitest';
import {
  djangoPathFromFillOcStaffProxy,
  toFillOcStaffProxyPath,
} from '~/utils/fill-oc-staff-paths';

describe('fill-oc staff proxy paths', () => {
  it('rewrites staff evidence URLs onto the fill-oc proxy', () => {
    expect(toFillOcStaffProxyPath('/api/rescue/evidence/148/')).toBe(
      '/api/fill-oc/staff/rescue/evidence/148/',
    );
  });

  it('maps the Nitro proxy path back to Django', () => {
    expect(
      djangoPathFromFillOcStaffProxy('/api/fill-oc/staff/chat/148/messages/'),
    ).toBe('/api/chat/148/messages/');
    expect(
      djangoPathFromFillOcStaffProxy('/api/fill-oc/staff/rescue/evidence/148/'),
    ).toBe('/api/rescue/evidence/148/');
    expect(djangoPathFromFillOcStaffProxy('/api/chat/1/messages/')).toBeNull();
  });
});
