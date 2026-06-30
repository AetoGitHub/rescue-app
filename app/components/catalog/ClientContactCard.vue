<script setup lang="ts">
import type { ClientContact } from '~/interfaces/catalogs/client';

const props = defineProps<{
  contact: ClientContact;
  selected?: boolean;
  removing?: boolean;
}>();

const emit = defineEmits<{
  select: [];
  remove: [];
}>();

const roleTags = computed(() => {
  const tags: string[] = [];
  if (props.contact.is_authorizer) tags.push('Autorizador');
  if (props.contact.receives_quotes) tags.push('Cotizaciones');
  if (props.contact.receives_oc_reminders) tags.push('OC recordatorio');
  if (props.contact.receives_account_status) tags.push('Edo. cuenta');
  if (props.contact.is_billing_contact) tags.push('Cobranza');
  return tags;
});

const positionLabel = computed(() => {
  const position = props.contact.position.trim();
  return position ? ` - ${position}` : '';
});
</script>

<template>
  <article
    class="cursor-pointer rounded-lg border bg-default p-4 transition-colors"
    :class="selected ? 'border-primary ring-1 ring-primary/30' : 'border-default hover:border-primary/40'"
    role="button"
    tabindex="0"
    @click="emit('select')"
    @keydown.enter="emit('select')"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 flex-wrap items-center gap-2">
        <h4 class="truncate text-base font-semibold text-highlighted">
          {{ contact.name }}<span class="font-normal text-muted">{{ positionLabel }}</span>
        </h4>
        <span
          v-if="contact.is_authorizer"
          class="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
        >
          <UIcon name="i-lucide-shield-check" class="size-3.5" />
          Autorizador
        </span>
        <span
          v-if="!contact.is_active"
          class="inline-flex shrink-0 rounded-full border border-default bg-elevated px-2.5 py-0.5 text-xs font-medium text-muted"
        >
          Inactivo
        </span>
      </div>

      <UButton
        color="neutral"
        variant="ghost"
        size="xs"
        icon="i-lucide-trash-2"
        :loading="removing"
        :disabled="removing"
        aria-label="Eliminar contacto"
        class="shrink-0"
        @click.stop="emit('remove')"
      />
    </div>

    <div class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
      <span v-if="contact.email" class="inline-flex items-center gap-1.5">
        <UIcon name="i-lucide-mail" class="size-4 shrink-0" />
        {{ contact.email }}
      </span>
      <span v-if="contact.phone" class="inline-flex items-center gap-1.5">
        <UIcon name="i-lucide-smartphone" class="size-4 shrink-0" />
        {{ contact.phone }}
      </span>
      <span v-if="contact.whatsapp" class="inline-flex items-center gap-1.5">
        <UIcon name="i-lucide-message-circle" class="size-4 shrink-0" />
        {{ contact.whatsapp }}
      </span>
    </div>

    <div
      v-if="roleTags.length > 0"
      class="mt-3 flex flex-wrap gap-2"
    >
      <span
        v-for="tag in roleTags"
        :key="tag"
        class="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary"
      >
        {{ tag }}
      </span>
    </div>
  </article>
</template>
