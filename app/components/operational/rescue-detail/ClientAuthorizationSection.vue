<script setup lang="ts">
import type { OperationalRescueStatus } from '~/constants/operational-kanban';

const props = defineProps<{
  rescueId: number;
  operativeStatus: OperationalRescueStatus | string;
}>();

const emit = defineEmits<{
  generated: [];
}>();

const showSection = computed(
  () => props.operativeStatus === 'pending_authorization',
);

const {
  generateLink,
  copyLastUrl,
  lastUrl,
  isGenerating,
} = useRescueApproveLinkGenerate(() => props.rescueId);

const hasLink = computed(() => Boolean(lastUrl.value.trim()));

async function onGenerate() {
  const url = await generateLink();
  if (url) emit('generated');
}

async function onCopy() {
  if (hasLink.value) {
    await copyLastUrl();
    return;
  }
  await onGenerate();
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

    <div v-if="hasLink" class="space-y-2">
      <UInput
        :model-value="lastUrl"
        readonly
        class="w-full font-mono text-xs"
        aria-label="Link de autorización"
      />
      <div class="flex flex-wrap gap-2">
        <UButton
          color="neutral"
          icon="i-lucide-copy"
          label="Copiar link"
          size="sm"
          variant="outline"
          @click="onCopy"
        />
        <UButton
          color="neutral"
          icon="i-lucide-refresh-cw"
          label="Regenerar link"
          size="sm"
          variant="outline"
          :loading="isGenerating"
          @click="onGenerate"
        />
      </div>
    </div>

    <div v-else class="flex flex-wrap gap-2">
      <UButton
        color="neutral"
        icon="i-lucide-link"
        label="Generar link de autorización"
        size="sm"
        variant="outline"
        :loading="isGenerating"
        @click="onGenerate"
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
  </section>
</template>
