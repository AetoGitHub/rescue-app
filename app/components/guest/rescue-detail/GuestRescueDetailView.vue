<script setup lang="ts">
import type { GuestRescueDetailTabValue } from '~/constants/guest-rescue-detail';
import { GUEST_RESCUE_DETAIL_TAB_ITEMS } from '~/constants/guest-rescue-detail';
import { RESCUE_EVIDENCE_TYPE_SERVICE } from '~/constants/rescue-evidence-api';
import { modalTabsUi } from '~/constants/tabs-layout';

const props = defineProps<{
  rescueId: number;
  token: string;
}>();

const activeTab = ref<GuestRescueDetailTabValue>('general');
const previousTab = ref<GuestRescueDetailTabValue>('general');
const evidenceModalOpen = ref(false);
const ignoreEvidenceTabSelection = ref(false);

const {
  detail,
  quoteDetail,
  evidences,
  chatMessages,
  useMock,
  mockGuestAuthorId,
  isPending,
  isQuotePending,
  errorMessage,
  quoteErrorMessage,
  refresh,
} = useGuestRescueAuthorize(
  () => props.rescueId,
  () => props.token,
);

const { sendMessage, isSending } = useGuestRescueChat(
  chatMessages,
  mockGuestAuthorId,
);

const {
  approve,
  isApproving,
  isApproved,
} = useGuestRescueApprove(
  () => props.rescueId,
  () => props.token,
);

const canApprove = computed(
  () =>
    detail.value?.operative_status === 'pending_authorization'
    && !isApproved.value,
);

async function onApprove() {
  const ok = await approve();
  if (ok) await refresh();
}

const serviceTypeBadge = computed(() => {
  if (!detail.value) return null;
  return getRescueServiceTypeBadge(detail.value.service_type);
});

const operativeStatusLabel = computed(() => {
  if (!detail.value) return '';
  return getOperationalStatusLabel(detail.value.operative_status);
});

const modalTitle = computed(() => detail.value?.folio ?? 'Detalle de rescate');

function openEvidenceModal() {
  evidenceModalOpen.value = true;
}

function navigateToTab(tab: GuestRescueDetailTabValue) {
  if (tab === 'evidence') {
    openEvidenceModal();
    return;
  }
  activeTab.value = tab;
  previousTab.value = tab;
}

function onActiveTabChange(tab: string | number) {
  const nextTab = tab as GuestRescueDetailTabValue;

  if (nextTab === 'evidence') {
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
</script>

<template>
  <div class="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6">
    <header class="flex flex-wrap items-center justify-between gap-4 border-b border-default pb-4">
      <div class="flex items-center gap-3">
        <UIcon name="i-lucide-life-buoy" class="size-8 text-primary" />
        <div>
          <p class="text-xs font-medium uppercase tracking-wider text-muted">
            Autorización de rescate
          </p>
          <h1 class="text-xl font-semibold text-highlighted">
            {{ modalTitle }}
          </h1>
        </div>
      </div>
      <UButton
        v-if="canApprove && !isPending && !errorMessage"
        color="primary"
        icon="i-lucide-check"
        label="Aprobar rescate"
        :loading="isApproving"
        @click="onApprove"
      />
    </header>

    <UAlert
      v-if="isApproved"
      color="success"
      variant="subtle"
      icon="i-lucide-circle-check"
      title="Rescate aprobado"
      description="La autorización se registró correctamente."
    />

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
      v-else-if="detail && rescueId != null"
      :model-value="activeTab"
      :items="[...GUEST_RESCUE_DETAIL_TAB_ITEMS]"
      class="flex flex-col gap-4"
      :ui="modalTabsUi"
      @update:model-value="onActiveTabChange"
    >
      <template #general>
        <OperationalRescueDetailGeneralTab
          :detail="detail"
          hide-client-authorization
          hide-economic-sensitive
          hide-supplier-section
          :editable="false"
          :guest-token="useMock ? undefined : token"
          :guest-author-id="useMock ? mockGuestAuthorId : undefined"
          :external-chat-messages="useMock ? chatMessages : undefined"
          :send-chat-message="useMock ? sendMessage : undefined"
          :is-sending-chat="useMock ? isSending : false"
        />
      </template>

      <template #evidence>
        <span class="sr-only" />
      </template>

      <template #quote>
        <LazyGuestRescueDetailGuestQuoteTab
          v-if="activeTab === 'quote'"
          :rescue-id="rescueId"
          :token="token"
          :quote-detail="quoteDetail"
          :is-pending="isQuotePending"
          :error-message="quoteErrorMessage"
        />
      </template>
    </UTabs>

    <LazyOperationalRescueDetailEvidenceModal
      v-if="detail && rescueId != null"
      v-model:open="evidenceModalOpen"
      :type="RESCUE_EVIDENCE_TYPE_SERVICE"
      :rescue-id="rescueId"
      :folio="detail.folio"
      readonly
      :external-evidences="evidences"
    />
  </div>
</template>
