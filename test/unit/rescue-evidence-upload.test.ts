import { describe, expect, it } from 'vitest';
import {
  RESCUE_EVIDENCE_TYPE_SERVICE,
  RESCUE_FIREBASE_UPLOAD_WEBHOOK_DEFAULT,
} from '~/constants/rescue-evidence-api';
import {
  buildFirebaseGeneralUploadUrl,
  buildRescueEvidenceStoragePath,
  extractUploadedFileUrl,
  isRescueEvidenceFileAllowed,
} from '~/utils/rescue-evidence-upload';

describe('buildRescueEvidenceStoragePath', () => {
  it('builds service evidence path', () => {
    expect(buildRescueEvidenceStoragePath(42, RESCUE_EVIDENCE_TYPE_SERVICE)).toBe(
      'rescue-2/rescue/42/services/',
    );
  });
});

describe('buildFirebaseGeneralUploadUrl', () => {
  it('appends path query with literal slashes', () => {
    const storagePath = buildRescueEvidenceStoragePath(
      42,
      RESCUE_EVIDENCE_TYPE_SERVICE,
    );
    expect(
      buildFirebaseGeneralUploadUrl(
        RESCUE_FIREBASE_UPLOAD_WEBHOOK_DEFAULT,
        storagePath,
      ),
    ).toBe(
      `${RESCUE_FIREBASE_UPLOAD_WEBHOOK_DEFAULT}?path=rescue-2/rescue/42/services/`,
    );
    expect(
      buildFirebaseGeneralUploadUrl(
        RESCUE_FIREBASE_UPLOAD_WEBHOOK_DEFAULT,
        storagePath,
      ),
    ).not.toContain('%2F');
  });

  it('replaces existing query on webhook base', () => {
    expect(
      buildFirebaseGeneralUploadUrl(
        'https://example.com/hook?old=1',
        'rescue-2/rescue/1/services/',
      ),
    ).toBe('https://example.com/hook?path=rescue-2/rescue/1/services/');
  });
});

describe('extractUploadedFileUrl', () => {
  it('reads url from root', () => {
    expect(
      extractUploadedFileUrl({ url: 'https://cdn.example.com/a.jpg' }),
    ).toBe('https://cdn.example.com/a.jpg');
  });

  it('reads downloadURL from nested data', () => {
    expect(
      extractUploadedFileUrl({
        data: { downloadURL: 'https://cdn.example.com/b.pdf' },
      }),
    ).toBe('https://cdn.example.com/b.pdf');
  });

  it('reads plain http string', () => {
    expect(extractUploadedFileUrl('https://cdn.example.com/c.png')).toBe(
      'https://cdn.example.com/c.png',
    );
  });

  it('throws when url is missing', () => {
    expect(() => extractUploadedFileUrl({ ok: true })).toThrow(
      'sin URL válida',
    );
  });
});

describe('isRescueEvidenceFileAllowed', () => {
  it('allows pdf under service limit', () => {
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 1024 });
    expect(isRescueEvidenceFileAllowed(file, RESCUE_EVIDENCE_TYPE_SERVICE)).toBe(
      true,
    );
  });

  it('rejects unknown extension', () => {
    const file = new File(['x'], 'doc.exe', { type: 'application/octet-stream' });
    Object.defineProperty(file, 'size', { value: 1024 });
    expect(isRescueEvidenceFileAllowed(file, RESCUE_EVIDENCE_TYPE_SERVICE)).toBe(
      false,
    );
  });
});
