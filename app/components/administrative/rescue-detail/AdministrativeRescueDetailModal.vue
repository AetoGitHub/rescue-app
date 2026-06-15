<script setup lang="ts">
import type { RescueDetailTabValue } from '~/constants/operational-rescue-detail';
import { RESCUE_DETAIL_TAB_ITEMS } from '~/constants/operational-rescue-detail';
import {
  RESCUE_EVIDENCE_TYPE_PAYMENT_PROVIDER,
  RESCUE_EVIDENCE_TYPE_SERVICE,
} from '~/constants/rescue-evidence-api';
import type { RescueEvidenceType } from '~/interfaces/rescue/evidence';
import { RESCUE_ADMINISTRATIVE_BUTTON_LABELS } from '~/constants/rescue-administrative-flow';
import type { AdministrativeRescueCard } from '~/interfaces/rescue/administrative';
import {
  administrativeDetailToCardDetail,
  cardToAdministrativePreviewDetail,
} from '~/utils/rescue-administrative-api-map';

const open = ref(false);
const rescueId = ref<number | null>(null);
const previewDetail = ref<ReturnType<
  typeof cardToAdministrativePreviewDetail
> | null>(null);
const activeTab = ref<RescueDetailTabValue>('general');
const previousTab = ref<RescueDetailTabValue>('general');
const evidenceModalOpen = ref(false);
const evidenceModalType = ref<RescueEvidenceType>(RESCUE_EVIDENCE_TYPE_SERVICE);
const ignoreEvidenceTabSelection = ref(false);

function isEvidenceTab(tab: RescueDetailTabValue): boolean {
  return tab === 'evidence' || tab === 'supplier_payment';
}

const { detail, isInitialLoading, errorMessage, refresh } =
  useRescueAdministrativeDetail(rescueId);

const displayDetail = computed(() => detail.value ?? previewDetail.value);

const effectiveUnlockedUntil = computed(() =>
  coalesceUnlockUntil(
    detail.value?.unlocked_until,
    previewDetail.value?.unlocked_until,
  ),
);

const quoteDetail = computed(() =>
  displayDetail.value
    ? administrativeDetailToCardDetail(displayDetail.value)
    : null,
);

const {
  remittanceModalOpen,
  invoiceModalOpen,
  invoiceSubmitAction,
  paymentModalOpen,
  cancelModalOpen,
  warrantyModalOpen,
  revertCancelModalOpen,
  remittanceForm,
  invoiceForm,
  paymentForm,
  cancellationReasonId,
  reacceptanceReasonId,
  purchaseOrderNumber,
  flowContext,
  handleAction,
  submitRemittance,
  submitInvoiceFromModal,
  submitPayment,
  submitAdminCancel,
  submitOpenWarranty,
  submitRevertAdminCancel,
  submitPurchaseOrder,
  regenerateRemittanceNumber,
  regenerateInvoiceNumber,
  openDocumentAction,
  isUpdating,
  purchaseOrderHighlight,
} = useRescueAdministrativeFlow({
  rescueId,
  detail: displayDetail,
  refresh,
});

const modalTitle = computed(
  () => displayDetail.value?.folio ?? 'Detalle administrativo',
);

const invoiceModalTitle = computed(() =>
  invoiceSubmitAction.value === 'skip_to_invoiced'
    ? RESCUE_ADMINISTRATIVE_BUTTON_LABELS.skipToInvoiced
    : RESCUE_ADMINISTRATIVE_BUTTON_LABELS.registerInvoice,
);

const serviceTypeBadge = computed(() => {
  if (!displayDetail.value) return null;
  return getRescueServiceTypeBadge(displayDetail.value.service_type);
});

const operativeStatusLabel = computed(() => {
  if (!displayDetail.value) return '';
  return getAdministrativeOperativeStatusLabel(
    displayDetail.value.operative_status,
  );
});

const billingBadge = computed(() => {
  if (!displayDetail.value) return null;
  return getBillingStatusBadge(displayDetail.value.billing_status);
});

function openEvidenceModal(type: RescueEvidenceType) {
  evidenceModalType.value = type;
  evidenceModalOpen.value = true;
}

function navigateToTab(tab: RescueDetailTabValue) {
  if (tab === 'evidence') {
    openEvidenceModal(RESCUE_EVIDENCE_TYPE_SERVICE);
    return;
  }
  if (tab === 'supplier_payment') {
    openEvidenceModal(RESCUE_EVIDENCE_TYPE_PAYMENT_PROVIDER);
    return;
  }
  activeTab.value = tab;
  previousTab.value = tab;
}

function onActiveTabChange(tab: string | number) {
  const nextTab = tab as RescueDetailTabValue;

  if (isEvidenceTab(nextTab)) {
    if (ignoreEvidenceTabSelection.value) {
      activeTab.value = previousTab.value;
      return;
    }
    if (!evidenceModalOpen.value) {
      navigateToTab(nextTab);
    }
    activeTab.value = previousTab.value;
    return;
  }

  navigateToTab(nextTab);
}

watch(evidenceModalOpen, (isOpen, wasOpen) => {
  if (wasOpen && !isOpen) {
    ignoreEvidenceTabSelection.value = true;
    activeTab.value = previousTab.value;
    nextTick(() => {
      ignoreEvidenceTabSelection.value = false;
    });
  }
});

function openDetail(id: number, preview?: AdministrativeRescueCard) {
  rescueId.value = id;
  previewDetail.value = preview
    ? cardToAdministrativePreviewDetail(preview)
    : null;
  activeTab.value = 'general';
  previousTab.value = 'general';
  open.value = true;
}

watch(open, (isOpen) => {
  if (!isOpen) {
    rescueId.value = null;
    previewDetail.value = null;
    activeTab.value = 'general';
    previousTab.value = 'general';
    evidenceModalOpen.value = false;
  }
});

defineExpose({ open: openDetail });
</script>

<template>
  <UModal
    v-model:open="open"
    :dismissible="false"
    scrollable
    :title="modalTitle"
    :ui="{ content: 'max-w-6xl' }"
  >
    <template #body>
      <div v-if="open && rescueId != null" class="space-y-4">
        <div v-if="isInitialLoading" class="space-y-4">
          <USkeleton class="h-8 w-64" />
          <USkeleton class="h-24 w-full" />
          <USkeleton class="h-96 w-full" />
        </div>

        <div
          v-else-if="errorMessage && !detail"
          class="flex flex-col items-center gap-3 py-12 text-center"
        >
          <UIcon name="i-lucide-triangle-alert" class="size-10 text-error" />
          <p class="text-sm text-muted">
            {{ errorMessage }}
          </p>
          <UButton
            color="neutral"
            icon="i-lucide-refresh-cw"
            label="Reintentar"
            variant="subtle"
            @click="refresh()"
          />
        </div>

        <template v-else-if="displayDetail && flowContext">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-2">
              <UBadge
                v-if="serviceTypeBadge"
                :color="serviceTypeBadge.color as 'info'"
                variant="subtle"
                class="uppercase"
              >
                <UIcon :name="serviceTypeBadge.icon" class="size-3.5" />
                {{ serviceTypeBadge.label }}
              </UBadge>
              <UBadge color="warning" variant="outline" class="uppercase">
                <UIcon name="i-lucide-clock" class="size-3.5" />
                {{ operativeStatusLabel }}
              </UBadge>
              <UBadge
                v-if="billingBadge"
                :color="billingBadge.color"
                variant="outline"
                class="uppercase"
              >
                <UIcon name="i-lucide-receipt" class="size-3.5" />
                {{ billingBadge.label }}
              </UBadge>
            </div>
            <AdministrativeRescueDetailUnlockRescue
              v-if="rescueId != null"
              :rescue-id="rescueId"
              :unlocked-until="effectiveUnlockedUntil"
              @success="refresh()"
            />
          </div>

          <LazyAdministrativeRescueDetailManagementSection
            :detail="displayDetail"
            :flow-context="flowContext"
            :purchase-order-highlight="purchaseOrderHighlight"
            :purchase-order-number="purchaseOrderNumber"
            :loading="isUpdating"
            @action="handleAction"
            @save-purchase-order="submitPurchaseOrder"
            @update:purchase-order-number="purchaseOrderNumber = $event"
            @document="openDocumentAction"
          />

          <UTabs
            :model-value="activeTab"
            :items="[...RESCUE_DETAIL_TAB_ITEMS]"
            class="flex flex-col gap-4"
            :ui="{ list: 'shrink-0 flex-wrap' }"
            @update:model-value="onActiveTabChange"
          >
            <template #general>
              <AdministrativeRescueDetailGeneralTab :detail="displayDetail" />
            </template>
            <template #evidence>
              <span class="sr-only" />
            </template>
            <template #supplier_payment>
              <span class="sr-only" />
            </template>
            <template #quote>
              <LazyOperationalRescueDetailQuoteTab
                v-if="activeTab === 'quote' && quoteDetail"
                :detail="quoteDetail"
                :rescue-id="rescueId!"
                @saved="refresh()"
              />
            </template>
            <template #pdf_report>
              <OperationalRescueDetailPlaceholderTab />
            </template>
            <template #manager_agent>
              <OperationalRescueDetailPlaceholderTab />
            </template>
          </UTabs>
        </template>

        <p v-else class="py-12 text-center text-sm text-muted">
          No se pudo cargar el detalle
        </p>
      </div>
    </template>

    <template v-if="displayDetail && flowContext && !isInitialLoading" #footer>
      <AdministrativeRescueDetailFooterActions
        :context="flowContext"
        :loading="isUpdating"
        @action="handleAction"
      />
    </template>
  </UModal>

  <LazyAdministrativeRescueDetailIssueRemittanceModal
    v-if="remittanceModalOpen"
    v-model:open="remittanceModalOpen"
    v-model:form="remittanceForm"
    :loading="isUpdating"
    @regenerate="regenerateRemittanceNumber"
    @submit="submitRemittance"
  />

  <LazyAdministrativeRescueDetailRegisterInvoiceModal
    v-if="invoiceModalOpen"
    v-model:open="invoiceModalOpen"
    v-model:form="invoiceForm"
    :loading="isUpdating"
    :submit-label="invoiceModalTitle"
    :title="invoiceModalTitle"
    @regenerate="regenerateInvoiceNumber"
    @submit="submitInvoiceFromModal"
  />

  <LazyAdministrativeRescueDetailApplyPaymentModal
    v-if="paymentModalOpen && rescueId != null"
    v-model:open="paymentModalOpen"
    v-model:form="paymentForm"
    :rescue-id="rescueId"
    :loading="isUpdating"
    @submit="submitPayment"
  />

  <LazyAdministrativeRescueDetailRevertAdminCancelModal
    v-if="revertCancelModalOpen"
    v-model:open="revertCancelModalOpen"
    v-model:reacceptance-reason-id="reacceptanceReasonId"
    :loading="isUpdating"
    @submit="submitRevertAdminCancel"
  />

  <LazyAdministrativeRescueDetailAdminCancelModal
    v-if="cancelModalOpen"
    v-model:open="cancelModalOpen"
    v-model:cancellation-reason-id="cancellationReasonId"
    :loading="isUpdating"
    @submit="submitAdminCancel"
  />

  <LazyAdministrativeRescueDetailOpenWarrantyConfirmModal
    v-if="warrantyModalOpen"
    v-model:open="warrantyModalOpen"
    :loading="isUpdating"
    @submit="submitOpenWarranty"
  />

  <LazyOperationalRescueDetailEvidenceModal
    v-if="displayDetail && rescueId != null"
    v-model:open="evidenceModalOpen"
    :type="evidenceModalType"
    :rescue-id="rescueId"
    :folio="displayDetail.folio"
  />
</template>
