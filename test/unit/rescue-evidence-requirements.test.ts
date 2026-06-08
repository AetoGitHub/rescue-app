import { describe, expect, it } from 'vitest';
import {
  RESCUE_EVIDENCE_TYPE_PAYMENT_PROVIDER,
  RESCUE_EVIDENCE_TYPE_SERVICE,
} from '~/constants/rescue-evidence-api';
import type { RescueEvidence } from '~/interfaces/rescue/evidence';
import {
  applyCloseEvidenceGuard,
  getMissingCloseEvidenceTypes,
  hasRequiredCloseEvidences,
  isCloseOperativeAction,
  MARK_AS_CLOSED_ACTION,
} from '~/utils/rescue-evidence-requirements';

const serviceEvidence: RescueEvidence = {
  id: 1,
  type: RESCUE_EVIDENCE_TYPE_SERVICE,
  url: 'https://example.com/service.jpg',
};

const paymentEvidence: RescueEvidence = {
  id: 2,
  type: RESCUE_EVIDENCE_TYPE_PAYMENT_PROVIDER,
  url: 'https://example.com/payment.pdf',
};

describe('hasRequiredCloseEvidences', () => {
  it('returns false when no evidences', () => {
    expect(hasRequiredCloseEvidences([])).toBe(false);
  });

  it('returns true with only service evidence', () => {
    expect(hasRequiredCloseEvidences([serviceEvidence])).toBe(true);
  });

  it('returns false with only payment evidence', () => {
    expect(hasRequiredCloseEvidences([paymentEvidence])).toBe(false);
  });

  it('returns true with both evidence types', () => {
    expect(
      hasRequiredCloseEvidences([serviceEvidence, paymentEvidence]),
    ).toBe(true);
  });
});

describe('getMissingCloseEvidenceTypes', () => {
  it('lists service when empty', () => {
    expect(getMissingCloseEvidenceTypes([])).toEqual([
      RESCUE_EVIDENCE_TYPE_SERVICE,
    ]);
  });

  it('lists nothing when service exists', () => {
    expect(getMissingCloseEvidenceTypes([serviceEvidence])).toEqual([]);
  });
});

describe('isCloseOperativeAction', () => {
  it('detects close operative actions', () => {
    expect(isCloseOperativeAction('complete_service')).toBe(true);
    expect(isCloseOperativeAction('take_request')).toBe(false);
  });
});

describe('applyCloseEvidenceGuard', () => {
  it('disables close actions when evidences are missing', () => {
    const actions = applyCloseEvidenceGuard(
      [
        {
          id: 'complete_service',
          label: 'Servicio completado',
          primary: true,
        },
        {
          id: MARK_AS_CLOSED_ACTION,
          label: 'Marcar como cerrado',
          primary: true,
        },
      ],
      [],
    );

    expect(actions[0]?.disabled).toBe(true);
    expect(actions[0]?.disabledReason).toBeTruthy();
    expect(actions[1]?.disabled).toBe(true);
  });

  it('leaves actions enabled when evidences are complete', () => {
    const actions = applyCloseEvidenceGuard(
      [
        {
          id: 'complete_service',
          label: 'Servicio completado',
          primary: true,
        },
      ],
      [serviceEvidence],
    );

    expect(actions[0]?.disabled).toBeUndefined();
  });
});
