import { describe, expect, it } from 'vitest';
import { mapRescueEvidenceListFromApi } from '~/utils/rescue-evidence-map';

describe('mapRescueEvidenceListFromApi', () => {
  it('maps a plain array', () => {
    expect(
      mapRescueEvidenceListFromApi([
        { id: 1, type: 'service', url: 'https://cdn.example.com/a.jpg' },
      ]),
    ).toEqual([
      { id: 1, type: 'service', url: 'https://cdn.example.com/a.jpg' },
    ]);
  });

  it('maps paginated results wrapper', () => {
    expect(
      mapRescueEvidenceListFromApi({
        next: null,
        previous: null,
        results: [
          { id: 2, type: 'payment_provider', url: 'https://cdn.example.com/b.pdf' },
        ],
      }),
    ).toEqual([
      { id: 2, type: 'payment_provider', url: 'https://cdn.example.com/b.pdf' },
    ]);
  });

  it('maps evidences key wrapper', () => {
    expect(
      mapRescueEvidenceListFromApi({
        evidences: [
          { id: 3, type: 'service', url: 'https://cdn.example.com/c.png' },
        ],
      }),
    ).toEqual([
      { id: 3, type: 'service', url: 'https://cdn.example.com/c.png' },
    ]);
  });

  it('returns empty list for unknown shape', () => {
    expect(mapRescueEvidenceListFromApi({ foo: 'bar' })).toEqual([]);
  });
});
