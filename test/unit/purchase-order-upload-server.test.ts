import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  buildPurchaseOrderUploadUrl,
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

  it('accepts one to twenty PDFs and forwards the files field', () => {
    const files = parsePurchaseOrderPdfParts([
      part('one.pdf'),
      part('two.pdf', 'application/octet-stream'),
    ]);
    const form = purchaseOrderPartsToFormData(files);

    expect(files).toHaveLength(2);
    expect(form.getAll('files')).toHaveLength(2);
  });

  it('rejects empty, oversized, and non-PDF batches', () => {
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
});
