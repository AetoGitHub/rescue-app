import { describe, expect, it } from 'vitest';
import {
  RESCUE_EVIDENCE_TYPE_PAYMENT_PROVIDER,
  RESCUE_EVIDENCE_TYPE_SERVICE,
} from '~/constants/rescue-evidence-api';
import { RESCUE_OPERATIVE_TOAST } from '~/constants/rescue-operative-flow';
import type { RescueEvidence } from '~/interfaces/rescue/evidence';
import {
  applyCloseEvidenceGuard,
  getEvidenceRequiredToastMessage,
  getMissingEvidenceTypesForAction,
  hasRequiredEvidencesForAction,
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

describe('hasRequiredEvidencesForAction', () => {
  it('requires service evidence for complete_service', () => {
    expect(hasRequiredEvidencesForAction([], 'complete_service')).toBe(false);
    expect(
      hasRequiredEvidencesForAction([serviceEvidence], 'complete_service'),
    ).toBe(true);
    expect(
      hasRequiredEvidencesForAction([paymentEvidence], 'complete_service'),
    ).toBe(false);
  });

  it('requires payment evidence for mark_as_closed', () => {
    expect(hasRequiredEvidencesForAction([], MARK_AS_CLOSED_ACTION)).toBe(
      false,
    );
    expect(
      hasRequiredEvidencesForAction([paymentEvidence], MARK_AS_CLOSED_ACTION),
    ).toBe(true);
    expect(
      hasRequiredEvidencesForAction([serviceEvidence], MARK_AS_CLOSED_ACTION),
    ).toBe(false);
  });
});

describe('getMissingEvidenceTypesForAction', () => {
  it('lists service when completing service without evidence', () => {
    expect(getMissingEvidenceTypesForAction([], 'complete_service')).toEqual([
      RESCUE_EVIDENCE_TYPE_SERVICE,
    ]);
  });

  it('lists payment when marking closed without payment evidence', () => {
    expect(
      getMissingEvidenceTypesForAction([serviceEvidence], MARK_AS_CLOSED_ACTION),
    ).toEqual([RESCUE_EVIDENCE_TYPE_PAYMENT_PROVIDER]);
  });
});

describe('getEvidenceRequiredToastMessage', () => {
  it('returns service message for service evidence', () => {
    expect(getEvidenceRequiredToastMessage([RESCUE_EVIDENCE_TYPE_SERVICE])).toBe(
      RESCUE_OPERATIVE_TOAST.evidenceServiceRequired,
    );
  });

  it('returns payment message for payment evidence', () => {
    expect(
      getEvidenceRequiredToastMessage([RESCUE_EVIDENCE_TYPE_PAYMENT_PROVIDER]),
    ).toBe(RESCUE_OPERATIVE_TOAST.evidencePaymentRequired);
  });
});

describe('isCloseOperativeAction', () => {
  it('detects close operative actions', () => {
    expect(isCloseOperativeAction('complete_service')).toBe(true);
    expect(isCloseOperativeAction('take_request')).toBe(false);
  });
});

describe('applyCloseEvidenceGuard', () => {
  it('disables complete_service when service evidence is missing', () => {
    const actions = applyCloseEvidenceGuard(
      [
        {
          id: 'complete_service',
          label: 'Servicio completado',
          primary: true,
        },
      ],
      [],
    );

    expect(actions[0]?.disabled).toBe(true);
    expect(actions[0]?.disabledReason).toBe(
      RESCUE_OPERATIVE_TOAST.evidenceServiceRequired,
    );
  });

  it('disables mark_as_closed when payment evidence is missing', () => {
    const actions = applyCloseEvidenceGuard(
      [
        {
          id: MARK_AS_CLOSED_ACTION,
          label: 'Marcar como cerrado',
          primary: true,
        },
      ],
      [serviceEvidence],
    );

    expect(actions[0]?.disabled).toBe(true);
    expect(actions[0]?.disabledReason).toBe(
      RESCUE_OPERATIVE_TOAST.evidencePaymentRequired,
    );
  });

  it('leaves mark_as_closed enabled with payment evidence', () => {
    const actions = applyCloseEvidenceGuard(
      [
        {
          id: MARK_AS_CLOSED_ACTION,
          label: 'Marcar como cerrado',
          primary: true,
        },
      ],
      [paymentEvidence],
    );

    expect(actions[0]?.disabled).toBeUndefined();
  });
});
