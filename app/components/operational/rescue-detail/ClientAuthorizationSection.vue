<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import type { CatalogDropdownFetcher } from '~/composables/useCatalogDropdown';
import { CLIENT_AUTHORIZERS_DROPDOWN_PATH } from '~/constants/client-api';
import type { OperationalRescueStatus } from '~/constants/operational-kanban';
import type { CatalogDropdownRow } from '~/interfaces/shared/catalog-dropdown.interface';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import {
  approveLinkGenerateSchema,
  emptyApproveLinkGenerateState,
  type ApproveLinkGenerateFormState,
} from '~/schemas/rescue-approve-link';

const props = defineProps<{
  rescueId: number;
  clientId: number;
  operativeStatus: OperationalRescueStatus | string;
}>();

const emit = defineEmits<{
  generated: [];
}>();

const showSection = computed(
  () => props.operativeStatus === 'pending_authorization',
);

const formRef = useTemplateRef('formRef');
const state = reactive<ApproveLinkGenerateFormState>(emptyApproveLinkGenerateState());

const {
  generateLink,
  copyLinkUrl,
  lastLinks,
  isGenerating,
} = useRescueApproveLinkGenerate(() => props.rescueId);

const generateLocked = ref(false);
const isGeneratePending = computed(
  () => generateLocked.value || isGenerating.value,
);
const hasLinks = computed(() => lastLinks.value.length > 0);
const canGenerate = computed(
  () => props.clientId > 0 && state.ids.length > 0 && !isGeneratePending.value,
);

const apiFetch = useApiFetch();

const fetchAuthorizersDropdown: CatalogDropdownFetcher = async (
  name,
  options,
) => {
  const res = await apiFetch<{
    count?: number;
    results?: CatalogDropdownRow[];
  } & Partial<PaginatedResponse<CatalogDropdownRow>>>(
    CLIENT_AUTHORIZERS_DROPDOWN_PATH(props.clientId),
    {
      query: name.trim() ? { name: name.trim() } : undefined,
      signal: options?.signal,
    },
  );

  return {
    next: res.next ?? null,
    previous: res.previous ?? null,
    results: res.results ?? [],
  };
};

const {
  searchTerm,
  items,
  loading,
  errorMessage,
} = useCatalogDropdown(fetchAuthorizersDropdown);

const selectedRowsById = ref<Map<number, CatalogDropdownRow>>(new Map());

const selected = computed({
  get: () => state.ids,
  set: (value: number[]) => {
    const nextMap = new Map<number, CatalogDropdownRow>();
    for (const id of value) {
      const fromItems = items.value.find((row) => row.id === id);
      const cached = selectedRowsById.value.get(id);
      if (fromItems != null) {
        nextMap.set(id, fromItems);
      } else if (cached != null) {
        nextMap.set(id, cached);
      } else {
        nextMap.set(id, { id, name: `Contacto #${id}` });
      }
    }
    selectedRowsById.value = nextMap;
    state.ids = value;
  },
});

watch(
  items,
  (list) => {
    if (state.ids.length === 0) return;
    const next = new Map(selectedRowsById.value);
    let changed = false;
    for (const id of state.ids) {
      const row = list.find((item) => item.id === id);
      if (row != null) {
        next.set(id, row);
        changed = true;
      }
    }
    if (changed) selectedRowsById.value = next;
  },
  { deep: true },
);

const displayItems = computed((): CatalogDropdownRow[] => {
  const list = items.value;
  const byId = new Map(list.map((row) => [row.id, row]));
  for (const id of state.ids) {
    if (byId.has(id)) continue;
    const cached = selectedRowsById.value.get(id);
    if (cached != null) {
      byId.set(id, cached);
    } else {
      byId.set(id, { id, name: `Contacto #${id}` });
    }
  }
  const selectedFirst = state.ids
    .map((id) => byId.get(id))
    .filter((row): row is CatalogDropdownRow => row != null);
  const rest = list.filter((row) => !state.ids.includes(row.id));
  return [...selectedFirst, ...rest];
});

async function onSubmit(event: FormSubmitEvent<ApproveLinkGenerateFormState>) {
  if (isGeneratePending.value) return;
  generateLocked.value = true;
  try {
    const links = await generateLink(event.data.ids);
    if (links) emit('generated');
  } finally {
    generateLocked.value = false;
  }
}

function onGenerateClick() {
  if (isGeneratePending.value) return;
  formRef.value?.submit();
}

async function onCopy(url: string) {
  await copyLinkUrl(url);
}
</script>

<template>
  <section
    v-if="showSection"
    class="space-y-3 rounded-lg border border-default bg-default p-4"
  >
    <h3 class="text-xs font-semibold uppercase tracking-wider text-muted">
      Autorización del cliente
    </h3>
    <div class="flex items-start gap-2 text-sm text-warning">
      <UIcon name="i-lucide-clock" class="size-4 shrink-0 mt-0.5" />
      <span>Pendiente de autorización</span>
    </div>

    <UForm
      ref="formRef"
      :schema="approveLinkGenerateSchema"
      :state="state"
      class="space-y-3"
      @submit="onSubmit"
    >
      <UFormField
        label="Autorizadores"
        name="ids"
        required
        hint="Selecciona uno o más contactos autorizadores"
      >
        <USelectMenu
          v-model="selected"
          v-model:search-term="searchTerm"
          ignore-filter
          multiple
          value-key="id"
          label-key="name"
          :items="displayItems"
          :loading="loading"
          placeholder="Seleccionar autorizadores"
          :disabled="isGeneratePending || clientId <= 0"
          class="w-full"
          variant="subtle"
          :ui="{ base: 'bg-default' }"
        />
        <p
          v-if="errorMessage"
          class="mt-1 text-xs text-error"
          role="alert"
        >
          {{ errorMessage }}
        </p>
      </UFormField>

      <div v-if="hasLinks" class="space-y-3">
        <div
          v-for="(link, index) in lastLinks"
          :key="`${link.url}-${index}`"
          class="space-y-1.5 rounded-md border border-default p-3"
        >
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <p class="text-sm font-medium text-highlighted">
              {{ link.user }}
            </p>
            <p
              v-if="link.numero_telefonico"
              class="text-xs text-muted"
            >
              {{ link.numero_telefonico }}
            </p>
          </div>
          <UInput
            :model-value="link.url"
            readonly
            class="w-full font-mono text-xs"
            :aria-label="`Link de autorización de ${link.user}`"
          />
          <UButton
            color="neutral"
            icon="i-lucide-copy"
            label="Copiar link"
            size="sm"
            variant="outline"
            @click="onCopy(link.url)"
          />
        </div>

        <div class="flex flex-wrap gap-2">
          <UButton
            color="neutral"
            icon="i-lucide-refresh-cw"
            label="Regenerar links"
            size="sm"
            variant="outline"
            :loading="isGeneratePending"
            :disabled="!canGenerate"
            @click="onGenerateClick"
          />
          <UTooltip text="Próximamente">
            <UButton
              color="primary"
              icon="i-simple-icons-whatsapp"
              label="Enviar por WhatsApp"
              size="sm"
              disabled
            />
          </UTooltip>
        </div>
      </div>

      <div v-else class="flex flex-wrap gap-2">
        <UButton
          color="neutral"
          icon="i-lucide-link"
          label="Generar links de autorización"
          size="sm"
          variant="outline"
          :loading="isGeneratePending"
          :disabled="!canGenerate"
          @click="onGenerateClick"
        />
        <UTooltip text="Próximamente">
          <UButton
            color="primary"
            icon="i-simple-icons-whatsapp"
            label="Enviar por WhatsApp"
            size="sm"
            disabled
          />
        </UTooltip>
      </div>
    </UForm>
  </section>
</template>
