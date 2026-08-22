<script setup lang="ts">
import { FILL_OC_LABELS } from '~/constants/fill-oc-api';
import { RESCUE_EVIDENCE_ZIP_WEBHOOK_DEFAULT } from '~/constants/rescue-evidence-api';
import type { FillOcPendingItem } from '~/interfaces/nexxt-step/fill-oc';
import {
  downloadPendingInvoiceEvidenceZip,
  PENDING_INVOICE_EVIDENCE_ZIP_ERROR,
} from '~/utils/pending-invoice-evidence';
import { isFillOcMockKey } from '~/mocks/fill-oc';

const props = defineProps<{
  apiKey: string;
}>();

const {
  items,
  isInitialLoading,
  isError,
  isUnauthorized,
  errorMessage,
  refresh,
} = useFillOcList(() => props.apiKey);

const {
  token,
  userId,
  ensureToken,
  staffFetch,
  evidenceApiFetch,
} = useFillOcStaffToken(() => props.apiKey);

const toast = useToast();
const runtimeConfig = useRuntimeConfig();
const isMock = computed(() => isFillOcMockKey(props.apiKey));

const search = ref('');
const savedIds = ref<number[]>([]);
const commentItem = ref<FillOcPendingItem | null>(null);
const isCommentOpen = ref(false);
const downloadingEvidenceId = ref<number | null>(null);

/** Un refetch en segundo plano no debe revivir una fila ya guardada. */
const pendingItems = computed(() =>
  items.value.filter((item) => !savedIds.value.includes(item.id)),
);

const visibleItems = computed(() =>
  pendingItems.value.filter((item) => matchesFillOcSearch(item, search.value)),
);

const hasSearch = computed(() => search.value.trim() !== '');
const showSearch = computed(
  () => pendingItems.value.length > 1 || hasSearch.value,
);

const pendingCountLabel = computed(() => {
  const count = pendingItems.value.length;
  const noun =
    count === 1 ? FILL_OC_LABELS.pendingCountSingular : FILL_OC_LABELS.pendingCount;
  return `${count} ${noun}`;
});

function onSaved(id: number) {
  savedIds.value = [...savedIds.value, id];
}

async function openComments(item: FillOcPendingItem) {
  try {
    await ensureToken();
    commentItem.value = item;
    isCommentOpen.value = true;
  } catch (error) {
    toast.add({
      title: FILL_OC_LABELS.commentsTitle,
      description: getFetchErrorMessage(error),
      color: 'error',
    });
  }
}

async function onEvidence(item: FillOcPendingItem) {
  if (downloadingEvidenceId.value === item.id) return;
  downloadingEvidenceId.value = item.id;
  try {
    await ensureToken();
    const filename = await downloadPendingInvoiceEvidenceZip({
      apiFetch: evidenceApiFetch,
      rescueId: item.id,
      folio: item.folio,
      column: 'evidencia_rescate',
      webhookUrl:
        runtimeConfig.public.evidenceZipWebhookUrl ||
        RESCUE_EVIDENCE_ZIP_WEBHOOK_DEFAULT,
    });
    toast.add({
      title: 'Descarga lista',
      description: filename,
      icon: 'i-lucide-archive',
      color: 'success',
    });
  } catch (error) {
    toast.add({
      title: PENDING_INVOICE_EVIDENCE_ZIP_ERROR,
      description: getFetchErrorMessage(error),
      color: 'error',
    });
  } finally {
    downloadingEvidenceId.value = null;
  }
}

const headerCellClass = 'bg-inverted px-2.5 py-2 text-xs font-semibold uppercase tracking-wider text-inverted';
</script>

<template>
  <div class="mx-auto flex min-h-0 w-full max-w-400 flex-1 flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
    <header
      class="sticky top-0 z-40 -mx-4 border-b border-default bg-muted/85 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 backdrop-blur-md"
    >
      <div class="mx-auto flex w-full max-w-400 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div class="flex min-w-0 items-start justify-between gap-3 sm:block">
          <div class="min-w-0">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Órdenes de compra
            </p>
            <h1 class="text-xl font-semibold tracking-tight text-highlighted">
              {{ FILL_OC_LABELS.pageTitle }}
            </h1>
          </div>

          <UBadge
            v-if="!isInitialLoading && !isError"
            color="neutral"
            variant="subtle"
            class="shrink-0 tabular-nums sm:mt-1"
            :label="pendingCountLabel"
          />
        </div>

        <UInput
          v-if="showSearch"
          v-model="search"
          icon="i-lucide-search"
          variant="subtle"
          class="w-full sm:max-w-sm"
          :placeholder="FILL_OC_LABELS.searchPlaceholder"
          :ui="{ base: 'bg-default' }"
        >
          <template
            v-if="hasSearch"
            #trailing
          >
            <UButton
              color="neutral"
              variant="link"
              size="xs"
              icon="i-lucide-x"
              aria-label="Limpiar búsqueda"
              @click="search = ''"
            />
          </template>
        </UInput>
      </div>
    </header>

    <div class="flex min-h-0 flex-1 flex-col pt-4">
      <AdministrativeFillOcStateMessage
        v-if="isUnauthorized"
        class="rounded-lg border border-muted bg-default"
        icon="i-lucide-shield-x"
        tone="error"
        :title="FILL_OC_LABELS.unauthorizedTitle"
        :description="FILL_OC_LABELS.unauthorizedDescription"
      />

      <AdministrativeFillOcStateMessage
        v-else-if="isError"
        class="rounded-lg border border-muted bg-default"
        icon="i-lucide-triangle-alert"
        tone="error"
        :title="FILL_OC_LABELS.loadErrorTitle"
        :description="errorMessage"
      >
        <template #action>
          <UButton
            color="neutral"
            variant="subtle"
            icon="i-lucide-refresh-cw"
            :label="FILL_OC_LABELS.retryButton"
            @click="() => void refresh()"
          />
        </template>
      </AdministrativeFillOcStateMessage>

      <AdministrativeFillOcStateMessage
        v-else-if="!isInitialLoading && pendingItems.length === 0"
        class="rounded-lg border border-muted bg-default"
        icon="i-lucide-check-check"
        tone="success"
        :title="FILL_OC_LABELS.empty"
        :description="FILL_OC_LABELS.emptyDescription"
      />

      <AdministrativeFillOcStateMessage
        v-else-if="!isInitialLoading && visibleItems.length === 0"
        class="rounded-lg border border-muted bg-default"
        icon="i-lucide-search-x"
        :title="FILL_OC_LABELS.noSearchResults"
        :description="FILL_OC_LABELS.noSearchResultsDescription"
      />

      <div
        v-else
        class="min-h-0 flex-1 overflow-auto rounded-lg border border-muted bg-default"
      >
        <table class="min-w-280 w-full border-collapse text-sm">
          <thead class="sticky top-0 z-30">
            <tr class="text-left">
              <th
                class="w-9"
                :class="headerCellClass"
              >
                <UIcon
                  name="i-lucide-message-square"
                  class="size-3.5 text-inverted"
                  aria-label="Comentarios"
                />
              </th>
              <th
                class="w-32"
                :class="headerCellClass"
              >
                Folio
              </th>
              <th
                class="w-36"
                :class="headerCellClass"
              >
                Responsable
              </th>
              <th
                class="w-28"
                :class="headerCellClass"
              >
                Unidad
              </th>
              <th
                class="w-40"
                :class="headerCellClass"
              >
                Fecha
              </th>
              <th
                class="w-72"
                :class="headerCellClass"
              >
                Descripción
              </th>
              <th
                class="w-32 text-right"
                :class="headerCellClass"
              >
                Subtotal
              </th>
              <th
                class="w-28 text-right"
                :class="headerCellClass"
              >
                IVA
              </th>
              <th
                class="w-32 text-right"
                :class="headerCellClass"
              >
                Total c/IVA
              </th>
              <th
                class="w-28 text-center"
                :class="headerCellClass"
              >
                Evid. rescate
              </th>
              <th
                class="sticky right-36 z-40 min-w-64 border-s border-inverted/20 shadow-[-8px_0_8px_-6px_rgba(0,0,0,0.35)]"
                :class="headerCellClass"
              >
                Número de OC
              </th>
              <th
                class="sticky right-0 z-40 w-36 border-s border-inverted/20 text-center"
                :class="headerCellClass"
              >
                Acción
              </th>
            </tr>
          </thead>

          <tbody v-if="isInitialLoading">
            <tr
              v-for="index in 6"
              :key="index"
              class="border-t border-default"
            >
              <td
                v-for="cell in 12"
                :key="cell"
                class="px-2.5 py-2"
              >
                <USkeleton class="h-6 w-full" />
              </td>
            </tr>
          </tbody>

          <TransitionGroup
            v-else
            tag="tbody"
            enter-active-class="transition-opacity duration-150 ease-out"
            enter-from-class="opacity-0"
            leave-active-class="transition-opacity duration-200 ease-out"
            leave-to-class="opacity-0"
          >
            <AdministrativeFillOcRow
              v-for="item in visibleItems"
              :key="item.id"
              :item="item"
              :api-key="apiKey"
              :downloading-evidence="downloadingEvidenceId === item.id"
              @saved="onSaved"
              @comment="openComments"
              @evidence="onEvidence"
            />
          </TransitionGroup>
        </table>
      </div>
    </div>

    <LazyAdministrativeFillOcCommentModal
      v-model:open="isCommentOpen"
      :item="commentItem"
      :staff-auth-token="token"
      :staff-user-id="userId"
      :staff-fetch="staffFetch"
      :fill-oc-mock="isMock"
    />
  </div>
</template>
