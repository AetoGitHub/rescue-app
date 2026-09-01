import { describe, expect, it, vi } from 'vitest';
import {
  TMS_PURCHASE_ORDER_MAX_FILE_BYTES,
  TMS_PURCHASE_ORDER_MAX_FILES,
} from '../../app/constants/tms-portal-api';
import type { TmsPurchaseOrderJob, TmsPurchaseOrderUploadFile } from '../../app/interfaces/portals/tms';
import { tmsPurchaseOrderUploadSchema } from '../../app/schemas/tms-portal';
import {
  formatPurchaseOrderJobDoneToast,
  getPurchaseOrderFileListError,
  isPurchaseOrderFileWithinSize,
  isPurchaseOrderPdfFile,
  mergePurchaseOrderJobFiles,
  runPurchaseOrderJobPoll,
  shouldStopPurchaseOrderJobPoll,
  summarizePurchaseOrderJobFiles,
} from '../../app/utils/purchase-order-job';

function pdf(name: string, size = 128): File {
  const file = new File([new Uint8Array(1)], name, { type: 'application/pdf' });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

function jobFile(
  fileName: string,
  overrides: Partial<TmsPurchaseOrderUploadFile> = {},
): TmsPurchaseOrderUploadFile {
  return {
    fileName,
    orderNumber: null,
    url: null,
    extracted: false,
    ...overrides,
  };
}

function job(
  status: TmsPurchaseOrderJob['status'],
  files: TmsPurchaseOrderUploadFile[] = [],
): TmsPurchaseOrderJob {
  return {
    jobId: 'job-1',
    status,
    total: 3,
    completed: files.length,
    files,
  };
}

describe('purchase-order job client helpers', () => {
  it('accepts only PDFs within the count and size limits', () => {
    expect(isPurchaseOrderPdfFile({ name: 'oc.pdf', type: 'application/pdf' })).toBe(true);
    expect(isPurchaseOrderPdfFile({ name: 'oc.PDF', type: 'application/octet-stream' })).toBe(true);
    expect(isPurchaseOrderPdfFile({ name: 'scan.png', type: 'image/png' })).toBe(false);
    expect(isPurchaseOrderFileWithinSize({ size: TMS_PURCHASE_ORDER_MAX_FILE_BYTES })).toBe(true);
    expect(isPurchaseOrderFileWithinSize({ size: TMS_PURCHASE_ORDER_MAX_FILE_BYTES + 1 })).toBe(false);
    expect(isPurchaseOrderFileWithinSize({ size: 0 })).toBe(false);

    expect(getPurchaseOrderFileListError([])).toBe('Selecciona al menos un archivo PDF');
    expect(
      getPurchaseOrderFileListError(
        Array.from({ length: TMS_PURCHASE_ORDER_MAX_FILES + 1 }, (_, index) => ({
          name: `${index}.pdf`,
          type: 'application/pdf',
          size: 10,
        })),
      ),
    ).toBe(`Puedes subir hasta ${TMS_PURCHASE_ORDER_MAX_FILES} archivos PDF`);
    expect(
      getPurchaseOrderFileListError([{ name: 'a.png', type: 'image/png', size: 10 }]),
    ).toBe('Selecciona únicamente archivos PDF');
    expect(
      getPurchaseOrderFileListError([
        { name: 'a.pdf', type: 'application/pdf', size: TMS_PURCHASE_ORDER_MAX_FILE_BYTES + 1 },
      ]),
    ).toBe('Cada PDF debe pesar 10 MB o menos');
  });

  it('validates the Zod upload schema for pdf, count and size', () => {
    expect(tmsPurchaseOrderUploadSchema.safeParse({ files: [pdf('ok.pdf')] }).success).toBe(true);
    expect(
      tmsPurchaseOrderUploadSchema.safeParse({
        files: [new File(['x'], 'photo.png', { type: 'image/png' })],
      }).success,
    ).toBe(false);
    expect(
      tmsPurchaseOrderUploadSchema.safeParse({
        files: Array.from({ length: TMS_PURCHASE_ORDER_MAX_FILES + 1 }, (_, index) =>
          pdf(`${index}.pdf`),
        ),
      }).success,
    ).toBe(false);

    const oversized = tmsPurchaseOrderUploadSchema.safeParse({
      files: [pdf('big.pdf', TMS_PURCHASE_ORDER_MAX_FILE_BYTES + 1)],
    });
    expect(oversized.success).toBe(false);
    if (!oversized.success) {
      expect(oversized.error.issues.some((issue) => issue.message.includes('10 MB'))).toBe(true);
    }
  });

  it('merges completed files by fileName without replacing the whole list', () => {
    const first = [
      jobFile('a.pdf', { extracted: true, orderNumber: '100', url: 'https://files.test/a.pdf' }),
    ];
    const merged = mergePurchaseOrderJobFiles(first, [
      jobFile('a.pdf', {
        extracted: true,
        orderNumber: '100',
        url: 'https://files.test/a-updated.pdf',
      }),
      jobFile('b.pdf', { message: 'Sin folio' }),
    ]);

    expect(merged.map((file) => file.fileName)).toEqual(['a.pdf', 'b.pdf']);
    expect(merged[0]?.url).toBe('https://files.test/a-updated.pdf');
    expect(merged[1]?.message).toBe('Sin folio');
  });

  it('summarizes toast counts as extracted / without folio / error', () => {
    const summary = summarizePurchaseOrderJobFiles([
      jobFile('ok.pdf', { extracted: true, orderNumber: '87' }),
      jobFile('plain.pdf', { message: 'No se encontró folio' }),
      jobFile('broken.pdf', { error: 'Upload failed' }),
    ]);

    expect(summary).toEqual({
      extracted: 1,
      withoutFolio: 1,
      errors: 1,
      total: 3,
    });

    const toast = formatPurchaseOrderJobDoneToast({
      extracted: 87,
      withoutFolio: 10,
      errors: 3,
      total: 100,
    });
    expect(toast.title).toBe(
      'Carga terminada: 87 con folio, 10 sin folio, 3 con error.',
    );
    expect(toast.color).toBe('warning');
  });

  it('stops polling when the job is done', async () => {
    expect(shouldStopPurchaseOrderJobPoll('pending')).toBe(false);
    expect(shouldStopPurchaseOrderJobPoll('processing')).toBe(false);
    expect(shouldStopPurchaseOrderJobPoll('done')).toBe(true);

    const fetchJob = vi
      .fn<[], Promise<TmsPurchaseOrderJob>>()
      .mockResolvedValueOnce(job('processing', [jobFile('a.pdf')]))
      .mockResolvedValueOnce(
        job('done', [
          jobFile('a.pdf', { extracted: true }),
          jobFile('b.pdf', { message: 'Sin folio' }),
        ]),
      );

    const snapshots: TmsPurchaseOrderJob[] = [];
    const result = await runPurchaseOrderJobPoll({
      fetchJob,
      intervalMs: 10,
      wait: async () => {},
      onSnapshot: (snapshot) => snapshots.push(snapshot),
    });

    expect(result.outcome).toBe('done');
    expect(fetchJob).toHaveBeenCalledTimes(2);
    expect(snapshots.map((item) => item.status)).toEqual(['processing', 'done']);
  });

  it('stops polling on 404 without treating it as done', async () => {
    const fetchJob = vi.fn<[], Promise<TmsPurchaseOrderJob>>().mockRejectedValue({
      statusCode: 404,
      message: 'Not Found',
    });

    const result = await runPurchaseOrderJobPoll({
      fetchJob,
      intervalMs: 10,
      wait: async () => {},
    });

    expect(result.outcome).toBe('not_found');
    expect(result.job).toBeNull();
    expect(fetchJob).toHaveBeenCalledTimes(1);
  });
});
