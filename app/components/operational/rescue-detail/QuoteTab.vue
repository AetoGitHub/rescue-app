<script setup lang="ts">
import type { CatalogDropdownFetcher } from '~/composables/useCatalogDropdown';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import type { CatalogDropdownRow } from '~/interfaces/shared/catalog-dropdown.interface';
import type { RescueCardDetail } from '~/interfaces/rescue/detail';
import type { RescueQuoteLine, RescueServiceType } from '~/interfaces/rescue';
import type { RescueCompanySettings } from '~/interfaces/rescue/company-settings';
import type { RescueQuoteDetail } from '~/interfaces/rescue/quote';
import { canEditRescueQuoteWithUnlock } from '~/utils/rescue-quote-tab';
import { mapRescueQuoteDetailFromApi } from '~/utils/rescue-quote-detail-map';

const props = defineProps<{
  detail: RescueCardDetail;
  rescueId: number;
  unlockSessionUntil?: string | null;
}>();

const emit = defineEmits<{
  saved: [];
}>();

const serviceType = computed(
  () => props.detail.service_type as RescueServiceType,
);

const editable = computed(() =>
  canEditRescueQuoteWithUnlock(props.detail, props.unlockSessionUntil),
);

const unlockCountdownUntil = computed(
  () => props.unlockSessionUntil ?? props.detail.unlocked_until,
);

const showUnlockCountdown = computed(
  () =>
    isRescueUnlockActive(props.detail.unlocked_until)
    || Boolean(props.unlockSessionUntil?.trim()),
);

const quoteLines = ref<RescueQuoteLine[]>(
  initialQuoteLinesForServiceType(serviceType.value),
);
const companySettings = ref<RescueCompanySettings | null>(null);
const linesHydrated = ref(false);

const { quoteDetail, isPending, errorMessage, refresh } = useRescueQuoteDetail(
  () => props.rescueId,
);

const { saveCreate, saveUpdate, isSaving } = useRescueQuoteSave(
  () => props.rescueId,
);

const isUpdateMode = computed(() => quoteDetail.value != null);

const saveLabel = computed(() =>
  isUpdateMode.value ? 'Actualizar cotización' : 'Guardar cotización',
);

function hydrateQuoteLines(detail: RescueQuoteDetail | null) {
  if (detail == null) {
    quoteLines.value = initialQuoteLinesForServiceType(serviceType.value);
    linesHydrated.value = true;
    return;
  }

  quoteLines.value = mapRescueQuoteDetailFromApi(
    detail,
    companySettings.value,
  );
  linesHydrated.value = true;
}

watch(
  quoteDetail,
  (detail) => {
    linesHydrated.value = false;
    hydrateQuoteLines(detail);
  },
  { immediate: true },
);

watch(companySettings, (settings) => {
  const detail = quoteDetail.value;
  if (detail == null || settings == null) return;
  quoteLines.value = mapRescueQuoteDetailFromApi(detail, settings);
});

function fetchServiceDropdown(
  name: string,
  options?: { signal?: AbortSignal },
) {
  return $fetch<PaginatedResponse<CatalogDropdownRow>>(
    '/api/catalogue/service/dropdown/',
    { query: { name }, signal: options?.signal },
  );
}

async function onSaveQuote() {
  const payload = {
    quoteLines: quoteLines.value,
    companySettings: companySettings.value,
    serviceType: serviceType.value,
  };

  const ok = isUpdateMode.value
    ? await saveUpdate(payload)
    : await saveCreate(payload);

  if (ok) {
    await refresh();
    emit('saved');
  }
}

function formatApiMoney(value: string | number | null | undefined): string {
  return formatRescueCardMoney(value);
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <RescueUnlockCountdown
      v-if="showUnlockCountdown"
      :unlocked-until="unlockCountdownUntil"
      :show-expired-hint="Boolean(unlockSessionUntil?.trim())"
    />

    <div v-if="isPending" class="flex items-center justify-center gap-2 py-12">
      <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin text-muted" />
      <span class="text-sm text-muted">Cargando cotización…</span>
    </div>

    <UAlert
      v-else-if="errorMessage"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      title="No se pudo cargar la cotización"
      :description="errorMessage"
    />

    <template v-else-if="quoteDetail && !editable">
      <UCard variant="subtle" :ui="{ body: 'space-y-4 text-sm' }">
        <div class="space-y-2">
          <h3 class="text-sm font-semibold text-highlighted">
            Cotización registrada
          </h3>
          <p class="text-2xl font-bold text-primary">
            {{ formatApiMoney(quoteDetail.total) }}
          </p>
        </div>

        <dl class="grid gap-2 sm:grid-cols-2 text-muted">
          <div>
            <dt>Costo técnico</dt>
            <dd class="font-medium text-highlighted tabular-nums">
              {{ formatApiMoney(quoteDetail.technical_cost) }}
            </dd>
          </div>
          <div>
            <dt>Subtotal</dt>
            <dd class="font-medium text-highlighted tabular-nums">
              {{ formatApiMoney(quoteDetail.sub_total) }}
            </dd>
          </div>
          <div v-if="quoteDetail.comissions_apply">
            <dt>Comisiones</dt>
            <dd class="font-medium text-highlighted tabular-nums">
              {{ formatApiMoney(quoteDetail.comissions_apply) }}
            </dd>
          </div>
          <div>
            <dt>IVA</dt>
            <dd class="font-medium text-highlighted tabular-nums">
              {{ quoteDetail.iva }}%
            </dd>
          </div>
        </dl>

        <ul class="divide-y divide-default border-t border-default pt-2">
          <li
            v-for="service in quoteDetail.services"
            :key="service.id"
            class="flex flex-wrap items-baseline justify-between gap-2 py-2 first:pt-0 last:pb-0"
          >
            <span class="font-medium text-highlighted">
              {{ service.service_name }}
              <span class="font-normal text-muted">× {{ service.quantity }}</span>
            </span>
            <span class="tabular-nums text-right">
              <span class="block text-xs text-muted">
                {{ formatApiMoney(service.real_cost) }}
              </span>
              {{ formatApiMoney(service.total) }}
            </span>
          </li>
        </ul>
      </UCard>
    </template>

    <template v-else-if="linesHydrated && editable">
      <OperationalRescueQuoteEditor
        v-model:quote-lines="quoteLines"
        v-model:company-settings="companySettings"
        :client-id="detail.client_id"
        :service-type="serviceType"
        :fetch-service-dropdown="fetchServiceDropdown"
      />

      <div class="flex justify-end border-t border-default pt-4">
        <UButton
          color="primary"
          icon="i-lucide-save"
          :label="saveLabel"
          :loading="isSaving"
          @click="onSaveQuote"
        />
      </div>
    </template>
  </div>
</template>
