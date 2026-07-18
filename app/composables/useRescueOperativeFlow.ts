import type { MaybeRefOrGetter } from 'vue';
import type { RescueDetailTabValue } from '~/constants/operational-rescue-detail';
import { RESCUE_OPERATIVE_TOAST } from '~/constants/rescue-operative-flow';
import type { RescueCardDetail } from '~/interfaces/rescue/detail';
import type {
  RescueAdvanceFormState,
  RescueAdvancePanelMode,
  RescueOperativeActionId,
  RescueServiceCompletedFormState,
} from '~/interfaces/rescue/operative';
import {
  rescueAdvanceAmountSchema,
  rescueAdvanceConfirmSchema,
  rescueCancelServiceSchema,
  rescueRevertCancellationSchema,
  rescueServiceCompletedSchema,
} from '~/schemas/rescue-operative';
import { toOperativeUpdatePayload } from '~/utils/rescue-operative-api-map';
import {
  buildSupplierRatingRows,
  getQuoteTotalForAdvance,
  requiresQuoteBeforeAuthorization,
  rescueDetailToFlowContext,
  shouldAutoSendDirectBudgetToAuthorization,
  todayIsoDate,
} from '~/utils/rescue-operative-flow';
import { mapClientCreditSummary } from '~/utils/catalog-detail-map';
import {
  getEvidenceRequiredToastMessage,
  getMissingEvidenceTypesForAction,
  getPrimaryEvidenceTabForMissing,
  hasRequiredEvidencesForAction,
  MARK_AS_CLOSED_ACTION,
} from '~/utils/rescue-evidence-requirements';
import {
  hasRescueSupplierAssigned,
} from '~/utils/rescue-supplier-assign';
import { emptyCatalogDropdownSelection } from '~/interfaces/shared/catalog-dropdown.interface';

export function useRescueOperativeFlow(options: {
  rescueId: MaybeRefOrGetter<number | null>;
  detail: MaybeRefOrGetter<RescueCardDetail | null>;
  refresh: () => Promise<unknown>;
  setActiveTab: (tab: RescueDetailTabValue) => void;
}) {
  const toast = useToast();
  const rescueId = computed(() => toValue(options.rescueId));
  const detail = computed(() => toValue(options.detail));

  const { updateOperative, isUpdating } = useRescueOperativeMutation(rescueId);
  const { createReviewsForRescue, isCreating: isCreatingReviews } =
    useSupplierReviewMutation();
  const { revertCancellation, isReverting } = useRescueRevertCancellation(rescueId);
  const { evidences } = useRescueEvidenceList(rescueId);

  const advancePanelOpen = ref(false);
  const advancePanelMode = ref<RescueAdvancePanelMode>('request');
  const completedPanelOpen = ref(false);
  const cancelModalOpen = ref(false);
  const revertModalOpen = ref(false);

  const advanceForm = reactive<RescueAdvanceFormState>({
    advance_amount: '',
    advance_date: todayIsoDate(),
    advance_reference: '',
  });

  const completedForm = reactive<RescueServiceCompletedFormState>({
    close_date: todayIsoDate(),
    disbursement_date: todayIsoDate(),
    ratings: [],
  });

  const cancellationReason = ref(emptyCatalogDropdownSelection());
  const reacceptanceReason = ref(emptyCatalogDropdownSelection());

  const creditOverlay = ref<{
    credit_limit: string | null;
    credit_available: number | null;
  } | null>(null);

  const supplierSectionHighlight = ref(false);
  const evidenceUploadHighlight = ref(false);
  const highlightedEvidenceAction = ref<RescueOperativeActionId | null>(null);

  const HIGHLIGHT_TIMEOUT_MS = 8_000;
  let supplierHighlightTimer: ReturnType<typeof setTimeout> | null = null;
  let evidenceHighlightTimer: ReturnType<typeof setTimeout> | null = null;

  function activateSupplierHighlight() {
    supplierSectionHighlight.value = true;
    if (supplierHighlightTimer) clearTimeout(supplierHighlightTimer);
    supplierHighlightTimer = setTimeout(() => {
      supplierSectionHighlight.value = false;
    }, HIGHLIGHT_TIMEOUT_MS);
  }

  function activateEvidenceHighlight(actionId: RescueOperativeActionId) {
    highlightedEvidenceAction.value = actionId;
    evidenceUploadHighlight.value = true;
    if (evidenceHighlightTimer) clearTimeout(evidenceHighlightTimer);
    evidenceHighlightTimer = setTimeout(() => {
      evidenceUploadHighlight.value = false;
    }, HIGHLIGHT_TIMEOUT_MS);
  }

  function clearCloseHighlights() {
    supplierSectionHighlight.value = false;
    evidenceUploadHighlight.value = false;
    highlightedEvidenceAction.value = null;
    if (supplierHighlightTimer) clearTimeout(supplierHighlightTimer);
    if (evidenceHighlightTimer) clearTimeout(evidenceHighlightTimer);
    supplierHighlightTimer = null;
    evidenceHighlightTimer = null;
  }

  async function loadClientCredit(clientId: number) {
    try {
      const raw = await $fetch<Record<string, unknown>>(
        `/api/catalogue/client/detail/${clientId}/`,
      );
      const summary = mapClientCreditSummary(raw);
      creditOverlay.value = {
        credit_limit: summary.credit_limit,
        credit_available: summary.credit_available,
      };
    } catch {
      creditOverlay.value = null;
    }
  }

  watch(
    detail,
    (d) => {
      creditOverlay.value = null;
      if (
        d?.service_type === 'loan'
        && d.operative_status === 'pending_authorization'
        && (d.credit_available == null || d.credit_limit == null)
      ) {
        void loadClientCredit(d.client_id);
      }
    },
    { immediate: true },
  );

  watch(
    () => detail.value?.supplier_id,
    (supplierId) => {
      if (supplierId != null) {
        supplierSectionHighlight.value = false;
        if (supplierHighlightTimer) {
          clearTimeout(supplierHighlightTimer);
          supplierHighlightTimer = null;
        }
      }
    },
  );

  watch(evidences, (list) => {
    const action = highlightedEvidenceAction.value;
    if (
      action != null
      && hasRequiredEvidencesForAction(list, action)
    ) {
      evidenceUploadHighlight.value = false;
      highlightedEvidenceAction.value = null;
      if (evidenceHighlightTimer) {
        clearTimeout(evidenceHighlightTimer);
        evidenceHighlightTimer = null;
      }
    }
  });

  const detailForActions = computed((): RescueCardDetail | null => {
    const d = detail.value;
    if (!d) return null;
    if (!creditOverlay.value) return d;
    return {
      ...d,
      credit_limit: creditOverlay.value.credit_limit ?? d.credit_limit,
      credit_available:
        creditOverlay.value.credit_available ?? d.credit_available,
    };
  });

  function resetAdvanceFormFromDetail(
    d: RescueCardDetail,
    mode: RescueAdvancePanelMode,
  ) {
    const amount = d.advance_amount;
    advanceForm.advance_amount =
      amount != null && String(amount).trim() !== ''
        ? String(amount)
        : '';
    advanceForm.advance_date =
      mode === 'confirm'
        ? todayIsoDate()
        : d.advance_date?.trim() || todayIsoDate();
    const method = d.advance_payment_method?.trim();
    advanceForm.advance_payment_method = method
      ? (method as NonNullable<RescueAdvanceFormState['advance_payment_method']>)
      : undefined;
    advanceForm.advance_reference = d.advance_reference?.trim() || '';
  }

  function openAdvancePanel(mode: RescueAdvancePanelMode) {
    const d = detail.value;
    if (d) resetAdvanceFormFromDetail(d, mode);
    advancePanelMode.value = mode;
    advancePanelOpen.value = true;
    options.setActiveTab('general');
  }

  function openCompletedPanel() {
    const d = detail.value;
    if (!d) return;
    completedForm.close_date = todayIsoDate();
    completedForm.disbursement_date = todayIsoDate();
    completedForm.disbursement_payment_method = undefined;
    completedForm.ratings = buildSupplierRatingRows(d);
    completedPanelOpen.value = true;
  }

  function ensureCloseEvidencesOrRedirect(
    actionId: RescueOperativeActionId,
  ): boolean {
    if (hasRequiredEvidencesForAction(evidences.value, actionId)) return true;

    const missing = getMissingEvidenceTypesForAction(
      evidences.value,
      actionId,
    );
    toast.add({
      title: getEvidenceRequiredToastMessage(missing),
      color: 'error',
    });
    activateEvidenceHighlight(actionId);
    options.setActiveTab(getPrimaryEvidenceTabForMissing(missing));
    return false;
  }

  function ensureSupplierBeforeCloseOrRedirect(): boolean {
    const d = detail.value;
    if (d == null || hasRescueSupplierAssigned(d)) return true;

    toast.add({
      title: RESCUE_OPERATIVE_TOAST.supplierRequiredBeforeClose,
      color: 'error',
    });
    activateSupplierHighlight();
    options.setActiveTab('general');
    return false;
  }

  function getOperativeSuccessToast(action: RescueOperativeActionId): string {
    switch (action) {
      case 'request_advance':
        return RESCUE_OPERATIVE_TOAST.advanceRequested;
      case 'modify_advance_amount':
        return RESCUE_OPERATIVE_TOAST.advanceModified;
      case 'confirm_advance_received':
        return RESCUE_OPERATIVE_TOAST.advanceConfirmed;
      case 'approve_without_advance':
        return RESCUE_OPERATIVE_TOAST.advanceApprovedWithout;
      case 'mark_as_closed':
        return RESCUE_OPERATIVE_TOAST.operativeUpdated;
      default:
        return RESCUE_OPERATIVE_TOAST.operativeUpdated;
    }
  }

  async function runUpdate(
    action: RescueOperativeActionId,
    forms?: {
      advance?: RescueAdvanceFormState;
      completed?: RescueServiceCompletedFormState;
      cancellationReasonId?: number | null;
    },
    afterSuccess?: () => Promise<void>,
  ) {
    const d = detail.value;
    if (d == null || rescueId.value == null) return;

    const body = toOperativeUpdatePayload(action, d, forms);
    await updateOperative(body);
    if (afterSuccess) {
      try {
        await afterSuccess();
      } catch {
        // Chat u otros efectos colaterales no bloquean el flujo principal
      }
    }
    toast.add({
      title: getOperativeSuccessToast(action),
      color: 'success',
    });
    await options.refresh();
  }

  async function handleAction(actionId: RescueOperativeActionId) {
    const d = detail.value;
    if (!d) return;

    const ctx = rescueDetailToFlowContext(d);

    if (actionId === 'send_to_authorization') {
      if (shouldAutoSendDirectBudgetToAuthorization(ctx)) {
        await runUpdate('send_to_authorization');
        return;
      }
      if (requiresQuoteBeforeAuthorization(ctx)) {
        toast.add({
          title: RESCUE_OPERATIVE_TOAST.quoteRequired,
          color: 'error',
        });
        options.setActiveTab('quote');
        return;
      }
      await runUpdate('send_to_authorization');
      return;
    }

    if (actionId === 'cancel_service') {
      cancellationReason.value = emptyCatalogDropdownSelection();
      cancelModalOpen.value = true;
      return;
    }

    if (actionId === 'revert_cancellation') {
      reacceptanceReason.value = emptyCatalogDropdownSelection();
      revertModalOpen.value = true;
      return;
    }

    if (actionId === 'request_advance') {
      openAdvancePanel('request');
      return;
    }

    if (actionId === 'approve_without_advance') {
      openAdvancePanel('approve_without');
      return;
    }

    if (actionId === 'confirm_advance_received') {
      openAdvancePanel('confirm');
      return;
    }

    if (actionId === 'modify_advance_amount') {
      openAdvancePanel('modify');
      return;
    }

    if (actionId === 'cancel_advance') {
      await runUpdate('cancel_advance');
      return;
    }

    if (actionId === 'approve_loan') {
      await runUpdate('approve_loan');
      return;
    }

    if (
      actionId === 'complete_service'
      || actionId === 'confirm_disbursement'
      || actionId === 'complete_project'
    ) {
      if (!ensureCloseEvidencesOrRedirect(actionId)) return;
      if (!ensureSupplierBeforeCloseOrRedirect()) return;
      openCompletedPanel();
      return;
    }

    if (actionId === MARK_AS_CLOSED_ACTION) {
      if (!ensureCloseEvidencesOrRedirect(MARK_AS_CLOSED_ACTION)) return;
      if (!ensureSupplierBeforeCloseOrRedirect()) return;
      await runUpdate(MARK_AS_CLOSED_ACTION);
      return;
    }

    if (actionId === 'start_project') {
      await runUpdate('start_project');
      return;
    }

    if (actionId === 'take_request') {
      await runUpdate('take_request');
      return;
    }
  }

  async function submitAdvancePanel() {
    const d = detail.value;
    if (!d) return;
    const mode = advancePanelMode.value;

    try {
      if (mode === 'approve_without') {
        await runUpdate('approve_without_advance', { advance: { ...advanceForm } });
        advancePanelOpen.value = false;
        return;
      }

      if (mode === 'modify') {
        const parsed = rescueAdvanceAmountSchema.safeParse(advanceForm);
        if (!parsed.success) {
          toast.add({
            title:
              parsed.error.issues[0]?.message
              ?? RESCUE_OPERATIVE_TOAST.advanceAmountRequired,
            color: 'error',
          });
          return;
        }
        const amount = parsed.data.advance_amount;
        // PENDING: mensaje de chat lo genera el backend
        await runUpdate('modify_advance_amount', {
          advance: { ...advanceForm, advance_amount: amount },
        });
        advancePanelOpen.value = false;
        return;
      }

      if (mode === 'confirm') {
        advanceForm.advance_date = todayIsoDate();
        const parsed = rescueAdvanceConfirmSchema.safeParse(advanceForm);
        if (!parsed.success) {
          toast.add({
            title:
              parsed.error.issues[0]?.message
              ?? RESCUE_OPERATIVE_TOAST.advanceConfirmRequired,
            color: 'error',
          });
          return;
        }
        await runUpdate('confirm_advance_received', {
          advance: { ...advanceForm, ...parsed.data },
        });
        advancePanelOpen.value = false;
        return;
      }

      const parsed = rescueAdvanceAmountSchema.safeParse(advanceForm);
      if (!parsed.success) {
        toast.add({
          title:
            parsed.error.issues[0]?.message
            ?? RESCUE_OPERATIVE_TOAST.advanceAmountRequired,
          color: 'error',
        });
        return;
      }
      const amount = parsed.data.advance_amount;
      // PENDING: mensaje de chat lo genera el backend
      await runUpdate('request_advance', {
        advance: { ...advanceForm, advance_amount: amount },
      });
      advancePanelOpen.value = false;
    } catch {
      // Error API: el panel permanece abierto para reintentar
    }
  }

  async function submitCloseWithReviews(
    action: RescueOperativeActionId,
    completed: RescueServiceCompletedFormState,
  ) {
    const id = rescueId.value;
    if (id == null) return;

    if (completed.ratings.length > 0) {
      await createReviewsForRescue(completed.ratings, id);
    }

    await runUpdate(action, { completed });
  }

  async function submitCompletedPanel() {
    const d = detail.value;
    if (!d) return;

    const parsed = rescueServiceCompletedSchema.safeParse({
      ...completedForm,
      is_loan: d.service_type === 'loan',
    });
    if (!parsed.success) {
      toast.add({
        title: parsed.error.issues[0]?.message ?? 'Revisa los campos de cierre',
        color: 'error',
      });
      return;
    }

    const action: RescueOperativeActionId =
      d.service_type === 'loan'
        ? 'confirm_disbursement'
        : d.operative_status === 'in_progress'
          ? 'complete_project'
          : 'complete_service';

    if (!ensureCloseEvidencesOrRedirect(action)) return;
    if (!ensureSupplierBeforeCloseOrRedirect()) return;

    try {
      await submitCloseWithReviews(action, {
        ...completedForm,
        ...parsed.data,
      });
      completedPanelOpen.value = false;
    } catch {
      // Error API: el panel permanece abierto para reintentar
    }
  }

  async function submitCancelService() {
    const parsed = rescueCancelServiceSchema.safeParse({
      cancellation_reason: cancellationReason.value.value,
    });
    if (!parsed.success) {
      toast.add({
        title: parsed.error.issues[0]?.message ?? 'Indica el motivo',
        color: 'error',
      });
      return;
    }
    await runUpdate('cancel_service', {
      cancellationReasonId: parsed.data.cancellation_reason,
    });
    cancelModalOpen.value = false;
  }

  async function submitRevertCancellation() {
    const parsed = rescueRevertCancellationSchema.safeParse({
      reacceptance_reason: reacceptanceReason.value.value,
    });
    if (!parsed.success) {
      toast.add({
        title: parsed.error.issues[0]?.message ?? 'Indica el motivo',
        color: 'error',
      });
      return;
    }

    if (rescueId.value == null) return;

    try {
      await revertCancellation({
        reacceptance_reason: parsed.data.reacceptance_reason,
      });
      toast.add({
        title: RESCUE_OPERATIVE_TOAST.cancellationReverted,
        color: 'success',
      });
      revertModalOpen.value = false;
      await options.refresh();
    } catch {
      // Error toast handled in mutation
    }
  }

  const isUpdatingOperative = computed(
    () => isUpdating.value || isReverting.value || isCreatingReviews.value,
  );

  const quoteTotalForAdvance = computed(() => {
    const d = detail.value;
    if (!d) return 0;
    return getQuoteTotalForAdvance(rescueDetailToFlowContext(d));
  });

  return {
    detailForActions,
    evidences,
    supplierSectionHighlight,
    evidenceUploadHighlight,
    clearCloseHighlights,
    advancePanelOpen,
    advancePanelMode,
    completedPanelOpen,
    cancelModalOpen,
    revertModalOpen,
    advanceForm,
    completedForm,
    cancellationReason,
    reacceptanceReason,
    isUpdating: isUpdatingOperative,
    quoteTotalForAdvance,
    handleAction,
    submitAdvancePanel,
    submitCompletedPanel,
    submitCancelService,
    submitRevertCancellation,
    openAdvancePanel,
    openCompletedPanel,
  };
}
