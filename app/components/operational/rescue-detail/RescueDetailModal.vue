<script setup lang="ts">
import type { RescueDetailTabValue } from '~/constants/operational-rescue-detail';
import { RESCUE_DETAIL_TAB_ITEMS } from '~/constants/operational-rescue-detail';

const open = ref(false);
const rescueId = ref<number | null>(null);
const activeTab = ref<RescueDetailTabValue>('general');

const { detail, isPending, errorMessage, refresh } = useRescueCardDetail(rescueId);

const operativeFlow = useRescueOperativeFlow({
  rescueId,
  detail,
  refresh,
  setActiveTab(tab) {
    activeTab.value = tab;
  },
});

const detailForFooter = computed(
  () => operativeFlow.detailForActions.value ?? detail.value,
);

const isUpdatingOperative = computed(() => operativeFlow.isUpdating.value);

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
  }
});

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
          v-model="activeTab"
          :items="[...RESCUE_DETAIL_TAB_ITEMS]"
          class="flex flex-col gap-4"
          :ui="{ list: 'shrink-0 flex-wrap' }"
        >
          <template #general>
            <OperationalRescueDetailGeneralTab :detail="detail" />
          </template>
          <template #evidence>
            <OperationalRescueDetailPlaceholderTab />
          </template>
          <template #supplier_payment>
            <OperationalRescueDetailPlaceholderTab />
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
        @action="operativeFlow.handleAction"
      />
    </template>
  </UModal>

  <OperationalRescueDetailAdvancePanel
    v-if="detail"
    v-model:open="operativeFlow.advancePanelOpen"
    v-model:form="operativeFlow.advanceForm"
    :mode="operativeFlow.advancePanelMode"
    :quote-total="operativeFlow.quoteTotalForAdvance"
    :loading="isUpdatingOperative"
    @submit="operativeFlow.submitAdvancePanel"
  />

  <OperationalRescueDetailServiceCompletedPanel
    v-if="detail"
    v-model:open="operativeFlow.completedPanelOpen"
    v-model:form="operativeFlow.completedForm"
    :is-loan="detail.service_type === 'loan'"
    :loading="isUpdatingOperative"
    @submit="operativeFlow.submitCompletedPanel"
  />

  <OperationalRescueDetailCancelServiceModal
    v-model:open="operativeFlow.cancelModalOpen"
    v-model:cancel-reason="operativeFlow.cancelReason"
    :loading="isUpdatingOperative"
    @submit="operativeFlow.submitCancelService"
  />
</template>
