<script setup lang="ts">
import type { RescueChatMessage } from '~/interfaces/rescue';

const props = defineProps<{
  rescueId: number;
}>();

const messageText = ref('');

const { user } = useUserSession();
const currentUserId = computed(() => user.value?.id ?? null);

const {
  messages,
  asyncStatus,
  hasNextPage,
  loadNextPage,
  isInitialLoading,
  isLoadingMore,
  errorMessage,
} = useRescueChatMessages(() => props.rescueId);

const { sendMessageAsync, isSending } = useRescueChatSendMessage(
  () => props.rescueId,
);

const scrollContainerRef = ref<HTMLElement | null>(null);

useScrollContainerInfiniteLoad({
  containerRef: scrollContainerRef,
  hasNextPage,
  loadNextPage,
  asyncStatus,
});

const messageCountLabel = computed(() => {
  const count = messages.value.length;
  return `${count} mensaje${count === 1 ? '' : 's'}`;
});

function messageVariant(message: RescueChatMessage) {
  return getRescueChatMessageVariant(message, currentUserId.value);
}

function senderLabel(
  message: RescueChatMessage,
  variant: ReturnType<typeof getRescueChatMessageVariant>,
): string {
  return getRescueChatMessageSenderLabel(message, variant);
}

async function submitMessage() {
  const text = messageText.value.trim();
  if (!text || isSending.value) return;

  try {
    await sendMessageAsync(text);
    messageText.value = '';
  } catch {
    // Toast handled in mutation
  }
}
</script>

<template>
  <section class="space-y-3 rounded-lg border border-default bg-default p-4">
    <div class="flex items-center justify-between gap-2">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-muted">
        Actividad y chat
      </h3>
      <span class="text-xs text-muted">{{ messageCountLabel }}</span>
    </div>

    <div
      ref="scrollContainerRef"
      class="max-h-56 min-h-40 space-y-3 overflow-y-auto rounded-lg border border-default bg-muted/20 p-3"
    >
      <div
        v-if="isInitialLoading"
        class="flex justify-center py-6"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-5 animate-spin text-muted"
        />
      </div>

      <p
        v-else-if="errorMessage"
        class="text-center text-xs text-error"
      >
        {{ errorMessage }}
      </p>

      <p
        v-else-if="messages.length === 0"
        class="py-6 text-center text-xs text-muted"
      >
        Sin mensajes en el chat
      </p>

      <template v-else>
        <div
          v-for="message in messages"
          :key="message.id"
        >
          <div
            v-if="messageVariant(message) === 'system'"
            class="flex justify-center py-1"
          >
            <p
              class="max-w-[90%] rounded-full bg-muted/40 px-3 py-1 text-center text-xs text-muted"
              :aria-label="`Mensaje del sistema: ${message.text}`"
            >
              {{ message.text }}
            </p>
          </div>

          <div
            v-else-if="messageVariant(message) === 'own'"
            class="flex justify-end"
          >
            <div
              class="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-inverted"
              :aria-label="`Tu mensaje: ${message.text}`"
            >
              <p class="text-sm whitespace-pre-wrap">
                {{ message.text }}
              </p>
              <p class="mt-1 text-right text-[10px] text-inverted/80">
                {{ formatChatMessageTime(message.created_at) }}
              </p>
            </div>
          </div>

          <div
            v-else
            class="flex justify-start"
          >
            <div
              class="max-w-[85%] rounded-2xl rounded-bl-sm border border-default bg-elevated px-3 py-2 text-left"
              :aria-label="`Mensaje de ${senderLabel(message, 'other')}: ${message.text}`"
            >
              <p class="text-xs font-medium text-highlighted">
                {{ senderLabel(message, 'other') }}
              </p>
              <p class="text-sm text-default whitespace-pre-wrap">
                {{ message.text }}
              </p>
              <p class="mt-1 text-[10px] text-muted">
                {{ formatChatMessageTime(message.created_at) }}
              </p>
            </div>
          </div>
        </div>
      </template>

      <div
        v-if="isLoadingMore"
        class="flex justify-center py-2"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-4 animate-spin text-muted"
        />
      </div>
    </div>

    <div class="flex items-end gap-2">
      <UTextarea
        v-model="messageText"
        :rows="2"
        class="min-w-0 flex-1"
        placeholder="Escribe un mensaje o actualización del servicio..."
        :disabled="isSending"
      />
      <UButton
        color="primary"
        icon="i-lucide-send"
        :loading="isSending"
        :disabled="!messageText.trim()"
        aria-label="Enviar mensaje"
        @click="submitMessage"
      />
    </div>

    <p class="text-[10px] leading-snug text-muted">
      Los gestores que participen en el chat recibirán comisión proporcional al cierre.
    </p>
  </section>
</template>
