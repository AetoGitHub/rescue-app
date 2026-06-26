<script setup lang="ts">
import type { OperativeCommissionOperator } from '~/interfaces/auth/operative-commission';
import { OPERATIVE_COMMISSION_TYPE_LABEL } from '~/constants/operative-commission';
import { operativeCommissionRowSchema } from '~/schemas/operative-commission';

const toast = useToast();

const {
  rows: rawRows,
  isInitialLoading,
  hasNextPage,
  loadNextPage,
  asyncStatus,
} = useOperativeCommissionList();

const operators = computed(() => mapOperativeCommissionRows(rawRows.value));

const drafts = reactive<Record<number, string>>({});
const savingOperatorId = ref<number | null>(null);

const { updateCommission } = useOperativeCommissionApi();

watch(
  operators,
  (list) => {
    for (const operator of list) {
      if (!(operator.id in drafts)) {
        drafts[operator.id] = operator.commission ?? '';
      }
    }
  },
  { immediate: true },
);

function commissionDraftNumber(operatorId: number) {
  const parsed = parseStringNumber(drafts[operatorId] ?? '');
  if (parsed == null) return undefined;
  return parsed / 100;
}

function setCommissionDraft(operatorId: number, value: number | undefined) {
  drafts[operatorId] =
    value == null || Number.isNaN(value)
      ? ''
      : formatStringNumber(value * 100, 2);
}

async function saveOperator(operator: OperativeCommissionOperator) {
  const commission = drafts[operator.id] ?? '';
  const parsed = operativeCommissionRowSchema.safeParse({ commission });
  if (!parsed.success) {
    toast.add({
      title: parsed.error.issues[0]?.message ?? 'Revisa la comisión',
      color: 'error',
    });
    return;
  }

  savingOperatorId.value = operator.id;
  try {
    await updateCommission(operator.id, parsed.data.commission);
    drafts[operator.id] = parsed.data.commission;
  } catch {
    // Toast handled in mutation
  } finally {
    savingOperatorId.value = null;
  }
}
</script>

<template>
  <section class="space-y-4 rounded-lg border border-default bg-default p-4">
    <div>
      <h2 class="text-lg font-semibold text-highlighted">
        Overrides por gestor
      </h2>
      <p class="mt-1 text-sm text-muted">
        Configura comisiones personalizadas por gestor operativo.
      </p>
    </div>

    <div
      v-if="isInitialLoading"
      class="flex justify-center py-12"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="size-8 animate-spin text-muted"
      />
    </div>

    <div
      v-else-if="operators.length === 0"
      class="py-8 text-center text-sm text-muted"
    >
      No hay gestores operativos registrados.
    </div>

    <div
      v-else
      class="space-y-3"
    >
      <article
        v-for="operator in operators"
        :key="operator.id"
        class="rounded-lg border border-default p-4"
      >
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div class="min-w-0 space-y-1 lg:flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="font-semibold text-highlighted">
                {{ operativeCommissionDisplayName(operator) }}
              </h3>
              <UBadge
                :color="
                  hasOperativeCommissionOverride(operator.commission)
                    ? 'warning'
                    : 'neutral'
                "
                variant="subtle"
                size="sm"
              >
                {{ operativeCommissionBadgeLabel(operator.commission) }}
              </UBadge>
            </div>
            <p class="text-sm text-muted">
              {{ operator.username }}
            </p>
          </div>

          <div class="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:max-w-xl">
            <UFormField
              label="Tipo"
              class="min-w-36"
            >
              <UInput
                :model-value="OPERATIVE_COMMISSION_TYPE_LABEL"
                class="w-full"
                disabled
              />
            </UFormField>

            <UFormField
              label="% (vacío = default)"
              class="min-w-36 flex-1"
            >
              <UInputNumber
                :model-value="commissionDraftNumber(operator.id)"
                v-bind="catalogPercentInputProps"
                placeholder="—"
                @update:model-value="setCommissionDraft(operator.id, $event)"
              />
            </UFormField>

            <UButton
              type="button"
              color="primary"
              label="Guardar"
              icon="i-lucide-save"
              class="shrink-0"
              :loading="savingOperatorId === operator.id"
              :disabled="savingOperatorId === operator.id"
              @click="saveOperator(operator)"
            />
          </div>
        </div>
      </article>

      <div
        v-if="hasNextPage"
        class="flex justify-center pt-2"
      >
        <UButton
          color="neutral"
          label="Cargar más"
          variant="subtle"
          :loading="asyncStatus === 'loading'"
          @click="loadNextPage()"
        />
      </div>
    </div>
  </section>
</template>
