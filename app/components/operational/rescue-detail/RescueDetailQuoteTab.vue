<script setup lang="ts">
import type { CatalogDropdownFetcher } from '~/composables/useCatalogDropdown';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import type { CatalogDropdownRow } from '~/interfaces/shared/catalog-dropdown.interface';
import type { RescueCardDetail } from '~/interfaces/rescue/detail';
import type { RescueQuoteLine, RescueServiceType } from '~/interfaces/rescue';
import type { RescueCompanySettings } from '~/interfaces/rescue/company-settings';
import {
  canEditRescueQuote,
  hasRescueQuoteOnDetail,
} from '~/utils/rescue-quote-tab';

const props = defineProps<{
  detail: RescueCardDetail;
  rescueId: number;
}>();

const emit = defineEmits<{
  saved: [];
}>();

const serviceType = computed(
  () => props.detail.service_type as RescueServiceType,
);

const showEditor = computed(() => canEditRescueQuote(props.detail));
const hasQuote = computed(() => hasRescueQuoteOnDetail(props.detail));

const quoteLines = ref<RescueQuoteLine[]>(
  initialQuoteLinesForServiceType(serviceType.value),
);
const companySettings = ref<RescueCompanySettings | null>(null);

const { saveCreate, isSaving } = useRescueQuoteSave(() => props.rescueId);

const quoteTotal = computed(() =>
  formatRescueCardMoney(
    parseRescueCardMoney(props.detail.sale_price) > 0
      ? props.detail.sale_price
      : props.detail.sub_total,
  ),
);

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
  const ok = await saveCreate({
    quoteLines: quoteLines.value,
    companySettings: companySettings.value,
    serviceType: serviceType.value,
  });
  if (ok) emit('saved');
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      v-if="hasQuote"
      class="space-y-4 rounded-lg border border-default bg-default p-6"
    >
      <div class="space-y-2">
        <h3 class="text-sm font-semibold text-highlighted">
          Cotización registrada
        </h3>
        <p class="text-2xl font-bold text-primary">
          {{ quoteTotal }}
        </p>
      </div>
      <UAlert
        color="info"
        variant="subtle"
        icon="i-lucide-info"
        title="Edición en construcción"
        description="La consulta y edición de partidas desde este modal estarán disponibles cuando el API de cotización exponga lectura y actualización. Por ahora solo puedes crear la cotización una vez al guardar."
      />
    </div>

    <template v-else>
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
          label="Guardar cotización"
          :loading="isSaving"
          @click="onSaveQuote"
        />
      </div>
    </template>
  </div>
</template>
