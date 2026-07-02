import { describe, expect, it } from 'vitest';
import { computeMultiFileUploadProgress } from '../../app/utils/rescue-evidence-upload';

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
