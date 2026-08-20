import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  buildPurchaseOrderUploadUrl,
  extractPurchaseOrderPartialResponse,
  normalizePurchaseOrderUploadResponse,
  parsePurchaseOrderPdfParts,
  purchaseOrderPartsToFormData,
  rejectedFilesToUploadResults,
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

  it('accepts one to twenty PDFs and forwards the files field', () => {
    const { accepted, rejected } = parsePurchaseOrderPdfParts([
      part('one.pdf'),
      part('two.pdf', 'application/octet-stream'),
    ]);
    const form = purchaseOrderPartsToFormData(accepted);

    expect(accepted).toHaveLength(2);
    expect(rejected).toEqual([]);
    expect(form.getAll('files')).toHaveLength(2);
  });

  it('keeps the valid PDFs of a mixed batch and reports the rest per file', () => {
    const { accepted, rejected } = parsePurchaseOrderPdfParts([
      part('one.pdf'),
      part('image.png', 'image/png'),
      { name: 'files', filename: 'empty.pdf', type: 'application/pdf', data: new Uint8Array() },
    ]);

    expect(accepted.map((file) => file.filename)).toEqual(['one.pdf']);
    expect(rejectedFilesToUploadResults(rejected)).toEqual([
      {
        fileName: 'image.png',
        orderNumber: null,
        url: null,
        extracted: false,
        error: 'Solo se aceptan archivos PDF',
      },
      {
        fileName: 'empty.pdf',
        orderNumber: null,
        url: null,
        extracted: false,
        error: 'El archivo está vacío',
      },
    ]);
  });

  it('rejects empty, oversized, and fully invalid batches', () => {
    expect(() => parsePurchaseOrderPdfParts([])).toThrow(
      'Selecciona al menos un archivo PDF',
    );
    expect(() =>
      parsePurchaseOrderPdfParts(Array.from({ length: 21 }, () => part('oc.pdf'))),
    ).toThrow('Puedes subir hasta 20 archivos PDF por lote');
    expect(() =>
      parsePurchaseOrderPdfParts([part('image.png', 'image/png')]),
    ).toThrow('Selecciona únicamente archivos PDF');
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
