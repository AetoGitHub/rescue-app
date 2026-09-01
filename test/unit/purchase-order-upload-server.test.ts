import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  assertPurchaseOrderJobId,
  buildPurchaseOrderJobUrl,
  buildPurchaseOrderUploadUrl,
  extractPurchaseOrderPartialResponse,
  normalizePurchaseOrderJob,
  normalizePurchaseOrderJobAccepted,
  normalizePurchaseOrderUploadResponse,
  parsePurchaseOrderPdfParts,
  purchaseOrderPartsToFormData,
  type PurchaseOrderMultipartPart,
} from '../../server/utils/purchase-order-upload';

beforeAll(() => {
  vi.stubGlobal(
    'createError',
    (input: { statusCode: number; message: string }) =>
      Object.assign(new Error(input.message), input),
  );
});

function part(
  filename: string,
  type = 'application/pdf',
): PurchaseOrderMultipartPart {
  return {
    name: 'files',
    filename,
    type,
    data: new Uint8Array([1, 2, 3]),
  };
}

describe('purchase-order upload server helpers', () => {
  it('builds the upstream URL from the quote PDF service', () => {
    expect(buildPurchaseOrderUploadUrl('')).toBe(
      'http://localhost:5000/purchase-orders/upload',
    );
    expect(buildPurchaseOrderUploadUrl('https://pdf.test/base/')).toBe(
      'https://pdf.test/base/purchase-orders/upload',
    );
  });

  it('builds the job status URL from the quote PDF service', () => {
    expect(buildPurchaseOrderJobUrl('', 'abc-1')).toBe(
      'http://localhost:5000/purchase-orders/jobs/abc-1',
    );
    expect(buildPurchaseOrderJobUrl('https://pdf.test/base/', 'job-9')).toBe(
      'https://pdf.test/base/purchase-orders/jobs/job-9',
    );
    expect(assertPurchaseOrderJobId('job-42')).toBe('job-42');
    expect(() => assertPurchaseOrderJobId('../secret')).toThrow(
      'Identificador de trabajo inválido',
    );
  });

  it('accepts one to one hundred PDFs and forwards the files field', () => {
    const { accepted, rejected } = parsePurchaseOrderPdfParts([
      part('one.pdf'),
      part('two.pdf', 'application/octet-stream'),
    ]);
    const form = purchaseOrderPartsToFormData(accepted);

    expect(accepted).toHaveLength(2);
    expect(rejected).toEqual([]);
    expect(form.getAll('files')).toHaveLength(2);
    expect(
      parsePurchaseOrderPdfParts(Array.from({ length: 100 }, (_, index) => part(`${index}.pdf`)))
        .accepted,
    ).toHaveLength(100);
  });

  it('rejects mixed, empty, oversized, and over-limit batches', () => {
    expect(() => parsePurchaseOrderPdfParts([])).toThrow(
      'Selecciona al menos un archivo PDF',
    );
    expect(() =>
      parsePurchaseOrderPdfParts(Array.from({ length: 101 }, () => part('oc.pdf'))),
    ).toThrow('Puedes subir hasta 100 archivos PDF');
    expect(() =>
      parsePurchaseOrderPdfParts([part('image.png', 'image/png')]),
    ).toThrow('Solo se aceptan archivos PDF');
    expect(() =>
      parsePurchaseOrderPdfParts([
        part('one.pdf'),
        { name: 'files', filename: 'empty.pdf', type: 'application/pdf', data: new Uint8Array() },
      ]),
    ).toThrow('El archivo está vacío');
    expect(() =>
      parsePurchaseOrderPdfParts([
        {
          name: 'files',
          filename: 'big.pdf',
          type: 'application/pdf',
          data: new Uint8Array(10 * 1024 * 1024 + 1),
        },
      ]),
    ).toThrow('Cada PDF debe pesar 10 MB o menos');
  });

  it('normalizes the 202 job acceptance and later snapshots', () => {
    expect(
      normalizePurchaseOrderJobAccepted({ jobId: 'job-1', total: 80 }),
    ).toEqual({ jobId: 'job-1', total: 80 });

    expect(
      normalizePurchaseOrderJob({
        jobId: 'job-1',
        status: 'processing',
        total: 80,
        completed: 23,
        files: [
          {
            fileName: 'oc.pdf',
            orderNumber: '2616071',
            url: 'https://files.test/oc.pdf',
            extracted: true,
          },
        ],
      }),
    ).toMatchObject({
      jobId: 'job-1',
      status: 'processing',
      total: 80,
      completed: 23,
      files: [{ fileName: 'oc.pdf', extracted: true }],
    });
  });

  it('normalizes partial upload results without dropping file errors', () => {
    expect(
      normalizePurchaseOrderUploadResponse({
        files: [
          {
            fileName: 'oc.pdf',
            orderNumber: '2616071',
            url: 'https://files.test/oc.pdf',
            extracted: true,
          },
          {
            fileName: 'failed.pdf',
            orderNumber: null,
            url: null,
            extracted: false,
            error: 'Upload failed',
          },
        ],
      }),
    ).toEqual({
      files: [
        {
          fileName: 'oc.pdf',
          orderNumber: '2616071',
          url: 'https://files.test/oc.pdf',
          extracted: true,
        },
        {
          fileName: 'failed.pdf',
          orderNumber: null,
          url: null,
          extracted: false,
          error: 'Upload failed',
        },
      ],
    });
  });

  it('keeps unreadable entries instead of discarding the whole batch', () => {
    const { files } = normalizePurchaseOrderUploadResponse(
      {
        files: [
          { filename: 'a.pdf', order_number: '2616071', file_url: 'https://files.test/a.pdf' },
          null,
        ],
      },
      { sentFileNames: ['a.pdf', 'b.pdf'] },
    );

    expect(files[0]).toEqual({
      fileName: 'a.pdf',
      orderNumber: '2616071',
      url: 'https://files.test/a.pdf',
      extracted: true,
    });
    expect(files[1]).toMatchObject({ fileName: 'b.pdf', extracted: false });
    expect(files[1]?.error).toContain('ilegible');
  });

  it('reports files the service never answered for', () => {
    const { files } = normalizePurchaseOrderUploadResponse(
      { files: [{ fileName: 'a.pdf', orderNumber: '1', url: 'https://files.test/a.pdf' }] },
      { sentFileNames: ['a.pdf', 'b.pdf'] },
    );

    expect(files).toHaveLength(2);
    expect(files[1]).toMatchObject({
      fileName: 'b.pdf',
      error: 'El servicio no devolvió resultado para este archivo',
    });
  });

  it('recovers per-file results from a failing upstream response', () => {
    const partial = extractPurchaseOrderPartialResponse(
      {
        statusCode: 500,
        data: {
          detail: 'Some files failed',
          files: [
            { fileName: 'a.pdf', orderNumber: '1', url: 'https://files.test/a.pdf' },
            { fileName: 'b.pdf', error: 'No se pudo leer el PDF' },
          ],
        },
      },
      { sentFileNames: ['a.pdf', 'b.pdf'] },
    );

    expect(partial?.batchError).toBe('Some files failed');
    expect(partial?.files.map((file) => file.fileName)).toEqual(['a.pdf', 'b.pdf']);
    expect(partial?.files[1]?.error).toBe('No se pudo leer el PDF');
  });

  it('ignores upstream errors without per-file payload', () => {
    expect(
      extractPurchaseOrderPartialResponse({ statusCode: 502, data: { detail: 'down' } }),
    ).toBeNull();
    expect(extractPurchaseOrderPartialResponse(new Error('boom'))).toBeNull();
  });

  it('rejects payloads without a files collection', () => {
    expect(() => normalizePurchaseOrderUploadResponse('nope')).toThrow(
      'Respuesta inválida del servicio de órdenes de compra',
    );
  });
});
