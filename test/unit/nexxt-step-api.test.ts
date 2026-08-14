import { describe, expect, it } from 'vitest';
import {
  djangoApiKeyAuthorization,
  isNexxtStepApiPath,
} from '../../server/utils/nexxt-step-api';

describe('djangoApiKeyAuthorization', () => {
  it('builds the Django Authorization header from the query key', () => {
    expect(
      djangoApiKeyAuthorization(
        'NOoVfQo_cRLiNy572Jzzdr6A_bP_d8hew9Ps0GmSlp8McBZ6wcGPQmfQ6A5_AAiC',
      ),
    ).toBe(
      'Api-Key NOoVfQo_cRLiNy572Jzzdr6A_bP_d8hew9Ps0GmSlp8McBZ6wcGPQmfQ6A5_AAiC',
    );
  });
});

describe('isNexxtStepApiPath', () => {
  it('matches fill_oc proxy paths and ignores other apis', () => {
    expect(isNexxtStepApiPath('/api/nexxt-step/fill_oc/')).toBe(true);
    expect(isNexxtStepApiPath('/api/nexxt-step/fill_oc/?key=abc')).toBe(true);
    expect(isNexxtStepApiPath('/api/nexxt-step/fill-oc')).toBe(true);
    expect(isNexxtStepApiPath('/api/rescue/cards/')).toBe(false);
  });
});
