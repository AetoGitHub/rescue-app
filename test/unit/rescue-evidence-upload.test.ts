import { describe, expect, it } from 'vitest';
import {
  buildRescueEvidenceZipFilename,
  buildRescueEvidenceZipPayload,
  computeMultiFileUploadProgress,
} from '../../app/utils/rescue-evidence-upload';

describe('computeMultiFileUploadProgress', () => {
  it('returns 0 for empty batch', () => {
    expect(computeMultiFileUploadProgress(0, 0, 50)).toBe(0);
  });

  it('computes progress for a single file', () => {
    expect(computeMultiFileUploadProgress(0, 1, 50)).toBe(50);
    expect(computeMultiFileUploadProgress(0, 1, 100)).toBe(100);
  });

  it('computes progress across multiple files', () => {
    expect(computeMultiFileUploadProgress(0, 2, 100)).toBe(50);
    expect(computeMultiFileUploadProgress(1, 2, 50)).toBe(75);
    expect(computeMultiFileUploadProgress(2, 2, 0)).toBe(100);
  });

  it('clamps file percent to 0-100', () => {
    expect(computeMultiFileUploadProgress(0, 1, 150)).toBe(100);
    expect(computeMultiFileUploadProgress(0, 1, -10)).toBe(0);
  });
});

describe('buildRescueEvidenceZipPayload', () => {
  it('builds body with complement by evidence type', () => {
    expect(
      buildRescueEvidenceZipPayload({
        rescueId: 42,
        folio: 'R-2026-001',
        type: 'service',
        urls: [' https://a.example/1.jpg ', '', 'https://a.example/2.pdf'],
      }),
    ).toEqual({
      rescue_id: 42,
      folio: 'R-2026-001',
      complement: 'evidencia-rescate',
      urls: ['https://a.example/1.jpg', 'https://a.example/2.pdf'],
    });
  });
});

describe('buildRescueEvidenceZipFilename', () => {
  it('builds a safe zip filename from folio and complement', () => {
    expect(
      buildRescueEvidenceZipFilename({
        folio: 'R-2026/001',
        complement: 'evidencia-rescate',
      }),
    ).toBe('R-2026_001-evidencia-rescate.zip');
  });
});
