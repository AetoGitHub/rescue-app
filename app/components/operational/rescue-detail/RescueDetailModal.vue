<script setup lang="ts">
import type { RescueDetailTabValue } from '~/constants/operational-rescue-detail';
import { RESCUE_DETAIL_TAB_ITEMS } from '~/constants/operational-rescue-detail';
import { RESCUE_EVIDENCE_MODAL_COPY } from '~/constants/rescue-evidence-api';

const open = ref(false);
const rescueId = ref<number | null>(null);
const activeTab = ref<RescueDetailTabValue>('general');
const previousTab = ref<RescueDetailTabValue>('general');
const serviceEvidenceOpen = ref(false);
const toast = useToast();

const { detail, isPending, errorMessage, refresh } = useRescueCardDetail(rescueId);

const {
  advancePanelOpen,
  advancePanelMode,
  advanceForm,
  quoteTotalForAdvance,
  completedPanelOpen,
  completedForm,
  cancelModalOpen,
  cancelReason,
  handleAction,
  submitAdvancePanel,
  submitCompletedPanel,
  submitCancelService,
  isUpdating,
  detailForActions,
} = useRescueOperativeFlow({
  rescueId,
  detail,
  refresh,
  setActiveTab(tab) {
    activeTab.value = tab;
  },
});

const detailForFooter = computed(
  () => detailForActions.value ?? detail.value,
);

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

function openDetail(id: number) {
  rescueId.value = id;
  activeTab.value = 'general';
  open.value = true;
}

watch(open, (isOpen) => {
  if (!isOpen) {
    rescueId.value = null;
    activeTab.value = 'general';
    previousTab.value = 'general';
    serviceEvidenceOpen.value = false;
  }
});

function onActiveTabChange(tab: string | number) {
  const value = tab as RescueDetailTabValue;
  if (value === 'evidence') {
    serviceEvidenceOpen.value = true;
    return;
  }
  if (value === 'supplier_payment') {
    toast.add({
      title: RESCUE_EVIDENCE_MODAL_COPY.supplierPaymentComingSoon,
      color: 'neutral',
    });
    return;
  }
  activeTab.value = value;
  previousTab.value = value;
}

defineExpose({ open: openDetail });
</script>

<template>
  <UModal
    v-model:open="open"
    scrollable
    :title="modalTitle"
    :ui="{ content: 'max-w-6xl' }"
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
            @click="refresh()"
          />
        </div>

        <UTabs
          v-else-if="detail"
          :model-value="activeTab"
          :items="[...RESCUE_DETAIL_TAB_ITEMS]"
          @update:model-value="onActiveTabChange"
          class="flex flex-col gap-4"
          :ui="{ list: 'shrink-0 flex-wrap' }"
        >
          <template #general>
            <OperationalRescueDetailGeneralTab :detail="detail">
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
            <OperationalRescueDetailQuoteTab
              :detail="detail"
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
      </div>
    </template>

    <template
      v-if="detailForFooter && !isPending && !errorMessage"
      #footer
    >
      <OperationalRescueDetailFooterActions
        :detail="detailForFooter"
        :loading="isUpdatingOperative"
        @action="handleAction"
      />
    </template>
  </UModal>

  <OperationalRescueDetailServiceCompletedPanel
    v-if="detail"
    v-model:open="completedPanelOpen"
    v-model:form="completedForm"
    :is-loan="detail.service_type === 'loan'"
    :loading="isUpdatingOperative"
    @submit="submitCompletedPanel"
  />

  <OperationalRescueDetailCancelServiceModal
    v-model:open="cancelModalOpen"
    v-model:cancel-reason="cancelReason"
    :loading="isUpdatingOperative"
    @submit="submitCancelService"
  />

  <OperationalRescueDetailEvidenceModal
    v-if="detail && rescueId != null"
    v-model:open="serviceEvidenceOpen"
    :rescue-id="rescueId"
    :folio="detail.folio"
  />
</template>
