import { describe, expect, it } from 'vitest';
import {
  assignTmsPurchaseOrders,
  matchesTmsRescueSearch,
  normalizeTmsRescuePage,
} from '../../app/utils/tms-portal';
import { tmsRescueDraftSchema, tmsRescueDraftToUpdateBody } from '../../app/schemas/tms-portal';
import type {
  TmsPurchaseOrderUploadFile,
  TmsRescue,
} from '../../app/interfaces/portals/tms';

function rescue(
  id: number,
  remittanceFolio: string | null,
): TmsRescue {
  return {
    id,
    folio: `PRE-2026-${String(id).padStart(5, '0')}`,
    internal_notes: id === 1 ? 'Llanta ponchada' : '',
    pdf_alegra: null,
    xml_alegra: null,
    remittance_folio: remittanceFolio,
    invoice_folio: `C${id}`,
    oc_pdf: null,
  };
}

function upload(
  orderNumber: string | null,
  url: string | null = 'https://files.test/oc.pdf',
): TmsPurchaseOrderUploadFile {
  return {
    fileName: 'oc.pdf',
    orderNumber,
    url,
    extracted: orderNumber != null,
  };
}

describe('TMS portal mapping', () => {
  it('normalizes legacy arrays and preserves cursor responses', () => {
    const rows = [rescue(1, '100')];
    expect(normalizeTmsRescuePage(rows)).toEqual({
      next: null,
      previous: null,
      results: rows,
    });

    const paginated = {
      next: 'https://api.test/rescues/?cursor=next',
      previous: null,
      results: rows,
    };
    expect(normalizeTmsRescuePage(paginated)).toBe(paginated);
  });

  it('auto-assigns only an exact unique remittance match', () => {
    const assignments = assignTmsPurchaseOrders(
      [
        upload(' 100 '),
        upload('404'),
        upload(null),
        upload('200', null),
      ],
      [rescue(1, '100'), rescue(2, '200')],
    );

    expect(assignments.map(({ rescueId, status }) => ({ rescueId, status }))).toEqual([
      { rescueId: 1, status: 'assigned' },
      { rescueId: null, status: 'unmatched' },
      { rescueId: null, status: 'unmatched' },
      { rescueId: null, status: 'failed' },
    ]);
  });

  it('leaves duplicate remittance matches for manual assignment', () => {
    const [assignment] = assignTmsPurchaseOrders(
      [upload('100')],
      [rescue(1, '100'), rescue(2, '100')],
    );
    expect(assignment?.status).toBe('ambiguous');
    expect(assignment?.rescueId).toBeNull();
  });

  it('searches folio, notes, remittance and invoice', () => {
    const row = rescue(1, '2616071');
    expect(matchesTmsRescueSearch(row, 'llanta')).toBe(true);
    expect(matchesTmsRescueSearch(row, '2616071')).toBe(true);
    expect(matchesTmsRescueSearch(row, 'pre-2026')).toBe(true);
    expect(matchesTmsRescueSearch(row, 'missing')).toBe(false);
  });

  it('builds the individual update body', () => {
    const parsed = tmsRescueDraftSchema.parse({
      internal_notes: 'Seguimiento',
      oc_pdf: ' https://files.test/oc.pdf ',
    });
    expect(tmsRescueDraftToUpdateBody(197, parsed)).toEqual({
      id: 197,
      oc_pdf: 'https://files.test/oc.pdf',
      internal_notes: 'Seguimiento',
    });
  });
});
