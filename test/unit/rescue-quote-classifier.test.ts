import { describe, expect, it } from 'vitest';
import type { QuoteClassifierResponse } from '~/interfaces/rescue/quote-classifier';
import {
  buildQuoteClassifierStoragePath,
  classifierResponseHasUnmatchedLines,
  isQuoteClassifierImageAllowed,
  mapClassifierLineToQuoteLine,
  mapClassifierResponseToQuoteLines,
  normalizeClassifierNotes,
  parseQuoteClassifierRequestBody,
} from '~/utils/rescue-quote-classifier';

describe('parseQuoteClassifierRequestBody', () => {
  it('accepts valid text payload', () => {
    expect(
      parseQuoteClassifierRequestBody({
        input: 'quiero una grúa',
        type: 'text',
      }),
    ).toEqual({ input: 'quiero una grúa', type: 'text' });
  });

  it('accepts valid image payload', () => {
    expect(
      parseQuoteClassifierRequestBody({
        input: 'https://cdn.example.com/quote.jpg',
        type: 'image',
      }),
    ).toEqual({
      input: 'https://cdn.example.com/quote.jpg',
      type: 'image',
    });
  });

  it('trims input text', () => {
    expect(
      parseQuoteClassifierRequestBody({
        input: '  grúa  ',
        type: 'text',
      }),
    ).toEqual({ input: 'grúa', type: 'text' });
  });

  it('rejects empty input', () => {
    expect(parseQuoteClassifierRequestBody({ input: '   ', type: 'text' })).toBeNull();
    expect(parseQuoteClassifierRequestBody({ input: '', type: 'text' })).toBeNull();
  });

  it('rejects invalid type', () => {
    expect(
      parseQuoteClassifierRequestBody({ input: 'hola', type: 'audio' }),
    ).toBeNull();
  });

  it('rejects non-object body', () => {
    expect(parseQuoteClassifierRequestBody(null)).toBeNull();
    expect(parseQuoteClassifierRequestBody('text')).toBeNull();
  });
});

describe('mapClassifierLineToQuoteLine', () => {
  it('maps matched catalog line', () => {
    const line = mapClassifierLineToQuoteLine({
      service_id: 101,
      service_label: 'GRUA PLATAFORMA',
      quantity: 1,
      unit_cost: 2500,
    });

    expect(line.service_id).toBe(101);
    expect(line.service_label).toBe('GRUA PLATAFORMA');
    expect(line.quantity).toBe(1);
    expect(line.unit_cost).toBe(2500);
    expect(line.contract_item_id).toBeNull();
    expect(line.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('maps unmatched line with null service_id', () => {
    const line = mapClassifierLineToQuoteLine({
      service_id: null,
      service_label: 'MANIOBRAS EN COCHERA',
      quantity: 1,
      unit_cost: 200,
    });

    expect(line.service_id).toBeNull();
    expect(line.service_label).toBe('MANIOBRAS EN COCHERA');
  });
});

describe('mapClassifierResponseToQuoteLines', () => {
  const successResponse: QuoteClassifierResponse = {
    success: true,
    quote_lines: [
      {
        service_id: 101,
        service_label: 'GRUA PLATAFORMA',
        quantity: 1,
        unit_cost: 2500,
      },
      {
        service_id: null,
        service_label: 'MANIOBRAS EN COCHERA',
        quantity: 1,
        unit_cost: 200,
      },
    ],
    notes: ['1 línea sin servicio registrado'],
  };

  it('maps all lines from successful response', () => {
    const lines = mapClassifierResponseToQuoteLines(successResponse);
    expect(lines).toHaveLength(2);
    expect(lines[0]?.service_id).toBe(101);
    expect(lines[1]?.service_id).toBeNull();
  });

  it('throws when success is false', () => {
    expect(() =>
      mapClassifierResponseToQuoteLines({
        success: false,
        quote_lines: [],
        notes: [],
      }),
    ).toThrow('El clasificador no pudo generar renglones');
  });

  it('throws when quote_lines is empty', () => {
    expect(() =>
      mapClassifierResponseToQuoteLines({
        success: true,
        quote_lines: [],
        notes: [],
      }),
    ).toThrow('El clasificador no devolvió renglones');
  });
});

describe('normalizeClassifierNotes', () => {
  it('returns trimmed string notes', () => {
    expect(
      normalizeClassifierNotes({
        success: true,
        quote_lines: [],
        notes: ['  nota  ', '', 'otra'],
      }),
    ).toEqual(['nota', 'otra']);
  });

  it('returns empty array for invalid notes', () => {
    expect(
      normalizeClassifierNotes({
        success: true,
        quote_lines: [],
        notes: null as unknown as string[],
      }),
    ).toEqual([]);
  });
});

describe('classifierResponseHasUnmatchedLines', () => {
  it('detects lines without service_id', () => {
    expect(
      classifierResponseHasUnmatchedLines({
        success: true,
        quote_lines: [{ service_id: null, service_label: 'X', quantity: 1, unit_cost: 1 }],
        notes: [],
      }),
    ).toBe(true);
  });

  it('returns false when all lines are matched', () => {
    expect(
      classifierResponseHasUnmatchedLines({
        success: true,
        quote_lines: [{ service_id: 1, service_label: 'X', quantity: 1, unit_cost: 1 }],
        notes: [],
      }),
    ).toBe(false);
  });
});

describe('buildQuoteClassifierStoragePath', () => {
  it('includes storage prefix and sanitized filename', () => {
    const path = buildQuoteClassifierStoragePath('cotizacion #1.jpg');
    expect(path).toMatch(/^rescue-2\/quote-classifier\/.+\/cotizacion_1\.jpg$/);
  });
});

describe('isQuoteClassifierImageAllowed', () => {
  it('allows jpeg under size limit', () => {
    const file = new File(['x'], 'photo.jpeg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 });
    expect(isQuoteClassifierImageAllowed(file)).toBe(true);
  });

  it('rejects pdf files', () => {
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 1024 });
    expect(isQuoteClassifierImageAllowed(file)).toBe(false);
  });

  it('rejects oversized images', () => {
    const file = new File(['x'], 'big.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });
    expect(isQuoteClassifierImageAllowed(file)).toBe(false);
  });
});
