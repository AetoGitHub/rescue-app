<script setup lang="ts">
import type { RescueDetailTabValue } from '~/constants/operational-rescue-detail';
import { RESCUE_DETAIL_TAB_ITEMS } from '~/constants/operational-rescue-detail';

const open = ref(false);
const rescueId = ref<number | null>(null);
const activeTab = ref<RescueDetailTabValue>('general');

const { detail, isPending, errorMessage, refresh } = useRescueCardDetail(rescueId);

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

const footerFlowLabel = computed(() => {
  if (!detail.value) return '';
  return getRescueDetailFooterFlowLabel(detail.value.operative_status);
});

const primaryActionLabel = computed(() => {
  if (!detail.value) return 'Continuar';
  return getRescueDetailPrimaryActionLabel(detail.value.operative_status);
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
            <OperationalRescueDetailPlaceholderTab />
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
      v-if="detail && !isPending && !errorMessage"
      #footer
    >
      <div class="flex w-full flex-wrap items-center justify-between gap-3">
        <p class="text-xs text-muted">
          {{ footerFlowLabel }}
        </p>
        <div class="flex items-center gap-2">
          <UButton
            color="primary"
            :label="primaryActionLabel"
          />
          <UDropdownMenu
            :items="[[{ label: 'Más opciones', disabled: true }]]"
          >
            <UButton
              color="neutral"
              icon="i-lucide-ellipsis"
              variant="outline"
              aria-label="Más opciones"
            />
          </UDropdownMenu>
        </div>
      </div>
    </template>
  </UModal>
</template>
