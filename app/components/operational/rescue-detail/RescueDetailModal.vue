<script setup lang="ts">
import type { RescueCardDetail } from '~/interfaces/rescue/detail';
import type { RescueDetailTabValue } from '~/constants/operational-rescue-detail';
import { RESCUE_DETAIL_TAB_ITEMS } from '~/constants/operational-rescue-detail';
import {
  RESCUE_EVIDENCE_TYPE_PAYMENT_PROVIDER,
  RESCUE_EVIDENCE_TYPE_SERVICE,
} from '~/constants/rescue-evidence-api';
import type { RescueEvidenceType } from '~/interfaces/rescue/evidence';

const open = ref(false);
const rescueId = ref<number | null>(null);
const activeTab = ref<RescueDetailTabValue>('general');
const previousTab = ref<RescueDetailTabValue>('general');
const evidenceModalOpen = ref(false);
const evidenceModalType = ref<RescueEvidenceType>(RESCUE_EVIDENCE_TYPE_SERVICE);
const assignSupplierModalOpen = ref(false);
/** Blocks UTabs from re-opening the evidence modal after close (tab sync). */
const ignoreEvidenceTabSelection = ref(false);

const emit = defineEmits<{
  closed: [];
}>();

function isEvidenceTab(tab: RescueDetailTabValue): boolean {
  return tab === 'evidence' || tab === 'supplier_payment';
}

const { detail, isPending, errorMessage, refresh } = useRescueCardDetail(rescueId);

const {
  advancePanelOpen,
  advancePanelMode,
  advanceForm,
  quoteTotalForAdvance,
  completedPanelOpen,
  completedForm,
  cancelModalOpen,
  revertModalOpen,
  cancellationReasonId,
  reacceptanceReasonId,
  handleAction,
  submitAdvancePanel,
  submitCompletedPanel,
  submitCancelService,
  submitRevertCancellation,
  isUpdating,
  detailForActions,
  evidences,
} = useRescueOperativeFlow({
  rescueId,
  detail,
  refresh,
  setActiveTab(tab) {
    navigateToTab(tab);
  },
});

const detailForFooter = computed(
  () => detailForActions.value ?? detail.value,
);

const modalFooterDetail = computed((): RescueCardDetail | null => {
  if (
    detailForFooter.value == null
    || isPending.value
    || errorMessage.value
    || activeTab.value === 'quote'
  ) {
    return null;
  }
  return detailForFooter.value;
});

const isUpdatingOperative = computed(() => isUpdating.value);

const modalTitle = computed(() => detail.value?.folio ?? 'Detalle de rescate');

const serviceTypeBadge = computed(() => {
  if (!detail.value) return null;
  return getRescueServiceTypeBadge(detail.value.service_type);
});

const operativeStatusLabel = computed(() => {
  if (!detail.value) return '';
  return getOperationalStatusLabel(detail.value.operative_status);
});

const adminStatusBadge = computed(() => {
  if (!detail.value) return null;
  return getAdminStatusBadge(detail.value.admin_status);
});

const { capturedUntil, hasEditSession } = useRescueUnlockEditSession(
  () => detail.value?.unlocked_until,
  open,
);

const unlockCountdownUntil = computed(
  () => capturedUntil.value ?? detail.value?.unlocked_until ?? null,
);

const showUnlockCountdown = computed(
  () =>
    isRescueUnlockActive(detail.value?.unlocked_until)
    || hasEditSession.value,
);

function openDetail(id: number) {
  if (rescueId.value === id && open.value) return;
  rescueId.value = id;
  activeTab.value = 'general';
  open.value = true;
}

function closeDetail() {
  open.value = false;
}

watch(open, (isOpen) => {
  if (!isOpen) {
    emit('closed');
    rescueId.value = null;
    activeTab.value = 'general';
    previousTab.value = 'general';
    evidenceModalOpen.value = false;
  }
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

defineExpose({ open: openDetail, close: closeDetail });

const { modalProps } = useResponsiveModal({ desktopMaxWidth: 'max-w-7xl' });

const modalTabsUi = computed(() => ({
  list: 'shrink-0 flex-nowrap overflow-x-auto max-w-full',
  trigger: 'shrink-0',
}));
</script>

<template>
  <UModal
    v-model:open="open"
    :dismissible="false"
    :title="modalTitle"
    v-bind="modalProps"
  >
    <template #body>
      <div v-if="open && rescueId != null" class="space-y-4">
        <div
          v-if="detail"
          class="flex flex-wrap items-center gap-2"
        >
          <UBadge
            v-if="serviceTypeBadge"
            :color="serviceTypeBadge.color as 'info'"
            variant="subtle"
            class="uppercase"
          >
            <UIcon :name="serviceTypeBadge.icon" class="size-3.5" />
            {{ serviceTypeBadge.label }}
          </UBadge>
          <UBadge
            color="warning"
            variant="outline"
            class="uppercase"
          >
            <UIcon name="i-lucide-clock" class="size-3.5" />
            {{ operativeStatusLabel }}
          </UBadge>
          <UBadge
            v-if="adminStatusBadge"
            :color="adminStatusBadge.color"
            variant="outline"
            class="uppercase"
          >
            <UIcon name="i-lucide-alert-circle" class="size-3.5" />
            {{ adminStatusBadge.label }}
          </UBadge>
          <RescueUnlockCountdown
            v-if="showUnlockCountdown"
            :unlocked-until="unlockCountdownUntil"
          />
        </div>

        <div
          v-if="isPending"
          class="space-y-4"
        >
          <USkeleton class="h-8 w-64" />
          <USkeleton class="h-96 w-full" />
        </div>

        <div
          v-else-if="errorMessage"
          class="flex flex-col items-center gap-3 py-12 text-center"
        >
          <UIcon
            name="i-lucide-triangle-alert"
            class="size-10 text-error"
          />
          <p class="text-sm text-muted">
            {{ errorMessage }}
          </p>
          <UButton
            color="neutral"
            icon="i-lucide-refresh-cw"
            label="Reintentar"
            variant="subtle"
            @click="() => void refresh()"
          />
        </div>

        <UTabs
          v-else-if="detail"
          :model-value="activeTab"
          :items="[...RESCUE_DETAIL_TAB_ITEMS]"
          class="flex flex-col gap-4"
          :ui="modalTabsUi"
          @update:model-value="onActiveTabChange"
        >
          <template #general>
            <OperationalRescueDetailGeneralTab
              :detail="detail"
              @assign-supplier="assignSupplierModalOpen = true"
            >
              <template #afterChat>
                <OperationalRescueDetailAdvancePanel
                  v-if="advancePanelOpen"
                  v-model:open="advancePanelOpen"
                  v-model:form="advanceForm"
                  :mode="advancePanelMode"
                  :quote-total="quoteTotalForAdvance"
                  :loading="isUpdatingOperative"
                  @submit="submitAdvancePanel"
                  @cancel="advancePanelOpen = false"
                />
              </template>
            </OperationalRescueDetailGeneralTab>
          </template>
          <template #evidence>
            <span class="sr-only" />
          </template>
          <template #supplier_payment>
            <span class="sr-only" />
          </template>
          <template #quote>
            <LazyOperationalRescueDetailQuoteTab
              v-if="activeTab === 'quote'"
              :detail="detail"
              :rescue-id="rescueId!"
              :unlock-session-until="capturedUntil"
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
      </div>
    </template>

    <template
      v-if="modalFooterDetail"
      #footer
    >
      <OperationalRescueDetailFooterActions
        :detail="modalFooterDetail"
        :evidences="evidences"
        :loading="isUpdatingOperative"
        @action="handleAction"
      />
    </template>
  </UModal>

  <LazyOperationalRescueDetailServiceCompletedPanel
    v-if="detail && completedPanelOpen"
    v-model:open="completedPanelOpen"
    v-model:form="completedForm"
    :is-loan="detail.service_type === 'loan'"
    :loading="isUpdatingOperative"
    @submit="submitCompletedPanel"
  />

  <LazyOperationalRescueDetailCancelServiceModal
    v-if="cancelModalOpen"
    v-model:open="cancelModalOpen"
    v-model:cancellation-reason-id="cancellationReasonId"
    :loading="isUpdatingOperative"
    @submit="submitCancelService"
  />

  <LazyOperationalRescueDetailRevertCancellationModal
    v-if="revertModalOpen"
    v-model:open="revertModalOpen"
    v-model:reacceptance-reason-id="reacceptanceReasonId"
    :loading="isUpdatingOperative"
    @submit="submitRevertCancellation"
  />

  <LazyOperationalRescueDetailEvidenceModal
    v-if="detail && rescueId != null"
    v-model:open="evidenceModalOpen"
    :type="evidenceModalType"
    :rescue-id="rescueId"
    :folio="detail.folio"
  />

  <LazyOperationalRescueDetailAssignSupplierModal
    v-if="detail && rescueId != null && assignSupplierModalOpen"
    v-model:open="assignSupplierModalOpen"
    :rescue-id="rescueId"
    :latitude="detail.latitude"
    :longitude="detail.longitude"
    :current-supplier-id="detail.supplier_id"
    :current-supplier-name="detail.supplier_name"
    @saved="refresh()"
  />
</template>
