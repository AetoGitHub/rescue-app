import { describe, expect, it } from 'vitest';
import {
  assignTmsPurchaseOrders,
  buildTmsRescueQuery,
  describeTmsAssignment,
  formatTmsUploadFeedback,
  isTmsRescueComplete,
  isTmsRescueReadOnly,
  matchesTmsRescueSearch,
  mergeTmsPurchaseOrderAssignments,
  normalizeTmsRescuePage,
  retryableTmsUploadFiles,
  serializeTmsRescueFilters,
  summarizeTmsAssignments,
  tmsRescueMissingFields,
  tmsTriStateItems,
  toTmsTriState,
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
    ready: false,
    correct_upload: false,
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
  it('normalizes missing ready and correct_upload as false', () => {
    const { results } = normalizeTmsRescuePage([
      { ...rescue(1, '100'), ready: true, correct_upload: true },
      {
        ...rescue(2, '200'),
        ready: undefined as unknown as boolean,
        correct_upload: undefined as unknown as boolean,
      },
    ]);
    expect(results.map((row) => [row.ready, row.correct_upload])).toEqual([
      [true, true],
      [false, false],
    ]);
    expect(isTmsRescueReadOnly(results[0]!)).toBe(true);
    expect(isTmsRescueReadOnly(results[1]!)).toBe(false);
  });

  it('marks a rescue complete only when every document and note exists', () => {
    const incomplete = rescue(1, '100');
    expect(isTmsRescueComplete(incomplete)).toBe(false);
    expect(tmsRescueMissingFields(incomplete)).toEqual([
      'pdf_alegra',
      'xml_alegra',
      'oc_pdf',
    ]);

    const complete = {
      ...incomplete,
      pdf_alegra: 'https://files.test/a.pdf',
      xml_alegra: 'https://files.test/a.xml',
      oc_pdf: 'https://files.test/oc.pdf',
    };
    expect(isTmsRescueComplete(complete)).toBe(true);
    expect(tmsRescueMissingFields(complete)).toEqual([]);

    expect(isTmsRescueComplete({ ...complete, internal_notes: '   ' })).toBe(false);
  });

  it('sends ready, confirm, oc_pdf and correct_upload only when the filter is a boolean', () => {
    expect(buildTmsRescueQuery(undefined)).toEqual({});
    expect(
      buildTmsRescueQuery({
        ready: null,
        confirm: undefined,
        oc_pdf: null,
        correct_upload: null,
      }),
    ).toEqual({});
    expect(
      buildTmsRescueQuery({
        ready: true,
        confirm: false,
        oc_pdf: true,
        correct_upload: false,
      }),
    ).toEqual({
      ready: 'true',
      confirm: 'false',
      oc_pdf: 'true',
      correct_upload: 'false',
    });
  });

  it('keys the query per filter combination', () => {
    expect(
      serializeTmsRescueFilters({
        ready: true,
        confirm: null,
        oc_pdf: false,
        correct_upload: false,
      }),
    ).toEqual([
      'ready:true',
      'confirm:all',
      'oc_pdf:false',
      'correct_upload:false',
    ]);
    expect(serializeTmsRescueFilters(undefined)).toEqual([
      'ready:all',
      'confirm:all',
      'oc_pdf:all',
      'correct_upload:all',
    ]);
  });

  it('maps the select option to a tri-state filter', () => {
    expect(toTmsTriState('all')).toBeNull();
    expect(toTmsTriState('true')).toBe(true);
    expect(toTmsTriState('false')).toBe(false);
    expect(tmsTriStateItems('Listo').map((item) => item.label)).toEqual([
      'Listo: todos',
      'Listo: sí',
      'Listo: no',
    ]);
  });

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
    expect(normalizeTmsRescuePage(paginated)).toEqual(paginated);
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

  it('does not auto-assign a remittance match that is already locked', () => {
    const [assignment] = assignTmsPurchaseOrders(
      [upload('100')],
      [{ ...rescue(1, '100'), correct_upload: true }],
    );
    expect(assignment).toMatchObject({ rescueId: null, status: 'unmatched' });
  });

  it('blocks assignment when the matching rescue already has an OC', () => {
    const [assignment] = assignTmsPurchaseOrders(
      [upload('100')],
      [{ ...rescue(1, '100'), oc_pdf: 'https://files.test/existing.pdf' }],
    );
    expect(assignment).toMatchObject({ rescueId: 1, status: 'blocked' });
    expect(describeTmsAssignment(assignment!).reason).toContain(
      'ya tiene un PDF asignado',
    );
  });

  it('blocks duplicate files from assigning the same rescue in one batch', () => {
    const assignments = assignTmsPurchaseOrders(
      [upload('100'), upload('100')],
      [rescue(1, '100')],
    );
    expect(assignments.map((assignment) => assignment.status)).toEqual([
      'assigned',
      'blocked',
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

  it('summarizes a mixed batch and reports failures in the feedback', () => {
    const assignments = assignTmsPurchaseOrders(
      [upload('100'), upload('404'), upload('200', null)],
      [rescue(1, '100')],
    );

    const summary = summarizeTmsAssignments(assignments);
    expect(summary).toEqual({
      total: 3,
      assigned: 1,
      blocked: 0,
      pending: 1,
      failed: 1,
    });

    const feedback = formatTmsUploadFeedback(summary);
    expect(feedback.color).toBe('warning');
    expect(feedback.title).toContain('1 error');
    expect(feedback.description).toContain('1 asignada');
    expect(feedback.description).toContain('1 con error');
  });

  it('flags a fully failed batch as an error', () => {
    const feedback = formatTmsUploadFeedback({
      total: 2,
      assigned: 0,
      blocked: 0,
      pending: 0,
      failed: 2,
    });
    expect(feedback.color).toBe('error');
    expect(feedback.title).toBe('Ningún PDF se pudo procesar');
  });

  it('explains each assignment status with an actionable reason', () => {
    const [assigned, unmatched, unreadable, failed] = assignTmsPurchaseOrders(
      [
        upload('100'),
        upload('404'),
        upload(null),
        { ...upload('500', null), error: 'Upload failed' },
      ],
      [rescue(1, '100')],
    );

    expect(describeTmsAssignment(assigned!).label).toBe('Asignada');
    expect(describeTmsAssignment(unmatched!).reason).toContain('404');
    expect(describeTmsAssignment(unreadable!).label).toBe('Orden no detectada');
    expect(describeTmsAssignment(failed!)).toMatchObject({
      label: 'Con error',
      reason: 'Upload failed',
      color: 'error',
    });
  });

  it('merges later job files into existing assignments by fileName', () => {
    const first = assignTmsPurchaseOrders(
      [{ ...upload('100'), fileName: 'a.pdf' }],
      [rescue(1, '100')],
    );
    const { assignments, newlyAssigned } = mergeTmsPurchaseOrderAssignments(
      first,
      [
        { ...upload('100'), fileName: 'a.pdf' },
        { ...upload('200'), fileName: 'b.pdf' },
      ],
      [rescue(1, '100'), rescue(2, '200')],
    );

    expect(assignments.map((item) => item.file.fileName)).toEqual(['a.pdf', 'b.pdf']);
    expect(newlyAssigned).toHaveLength(1);
    expect(newlyAssigned[0]).toMatchObject({
      file: { fileName: 'b.pdf' },
      rescueId: 2,
      status: 'assigned',
    });
    expect(assignments[0]?.rescueId).toBe(1);
  });

  it('keeps only the failed files selected for a retry', () => {
    const ok = new File(['ok'], 'ok.pdf', { type: 'application/pdf' });
    const broken = new File(['broken'], 'broken.pdf', {
      type: 'application/pdf',
    });
    const assignments = assignTmsPurchaseOrders(
      [
        { ...upload('100'), fileName: 'ok.pdf' },
        { ...upload(null, null), fileName: 'broken.pdf' },
      ],
      [rescue(1, '100')],
    );

    expect(retryableTmsUploadFiles([ok, broken], assignments)).toEqual([broken]);
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
