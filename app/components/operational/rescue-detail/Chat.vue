<script setup lang="ts">
import type { RescueChatMessage } from '~/interfaces/rescue';

const props = withDefaults(
  defineProps<{
    rescueId?: number;
    layout?: 'inline' | 'sidebar';
    guestAuthorId?: number | null;
    externalMessages?: RescueChatMessage[] | null;
    sendMessage?: (text: string) => Promise<void>;
    isSendingExternal?: boolean;
  }>(),
  {
    rescueId: undefined,
    layout: 'inline',
    guestAuthorId: undefined,
    externalMessages: undefined,
    sendMessage: undefined,
    isSendingExternal: false,
  },
);

const messageText = ref('');

const isGuestMode = computed(
  () => props.externalMessages != null && props.sendMessage != null,
);

const isSidebar = computed(() => props.layout === 'sidebar');

const scrollAreaClass = computed(() =>
  isSidebar.value
    ? 'flex-1 min-h-0 max-h-none'
    : 'max-h-56 min-h-40',
);

const sectionClass = computed(() =>
  isSidebar.value
    ? 'flex h-full min-h-[min(50vh,420px)] flex-col space-y-3'
    : 'space-y-3',
);

const { user } = useUserSession();
const sessionUserId = computed(() => user.value?.id ?? null);

const currentUserId = computed(() => {
  if (props.guestAuthorId != null) return props.guestAuthorId;
  return sessionUserId.value;
});

const effectiveRescueId = computed(() =>
  isGuestMode.value ? null : (props.rescueId ?? null),
);

const {
  messages: apiMessages,
  asyncStatus,
  hasNextPage,
  loadNextPage,
  isInitialLoading: apiIsInitialLoading,
  isLoadingMore: apiIsLoadingMore,
  errorMessage: apiErrorMessage,
} = useRescueChatMessages(effectiveRescueId);

const { sendMessageAsync, isSending: apiIsSending } =
  useRescueChatSendMessage(effectiveRescueId);

const messages = computed(() => {
  if (isGuestMode.value) return props.externalMessages ?? [];
  return apiMessages.value;
});

const isInitialLoading = computed(() => {
  if (isGuestMode.value) return false;
  return apiIsInitialLoading.value;
});

const isLoadingMore = computed(() => {
  if (isGuestMode.value) return false;
  return apiIsLoadingMore.value;
});

const errorMessage = computed(() => {
  if (isGuestMode.value) return '';
  return apiErrorMessage.value;
});

const isSending = computed(() => {
  if (isGuestMode.value) return props.isSendingExternal;
  return apiIsSending.value;
});

const scrollContainerRef = ref<HTMLElement | null>(null);
const pendingScrollAfterSend = ref(false);

const scrollHasNextPage = computed(() =>
  isGuestMode.value ? false : hasNextPage.value,
);

useScrollContainerInfiniteLoad({
  containerRef: scrollContainerRef,
  hasNextPage: scrollHasNextPage,
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

function scrollChatToBottom() {
  const container = scrollContainerRef.value;
  if (!container) return;
  container.scrollTop = container.scrollHeight;
}

watch(messages, () => {
  if (!pendingScrollAfterSend.value) return;
  pendingScrollAfterSend.value = false;
  nextTick(scrollChatToBottom);
});

async function submitMessage() {
  const text = messageText.value.trim();
  if (!text || isSending.value) return;

  try {
    if (isGuestMode.value && props.sendMessage) {
      await props.sendMessage(text);
    } else {
      await sendMessageAsync(text);
    }
    messageText.value = '';
    pendingScrollAfterSend.value = true;
    await nextTick();
    scrollChatToBottom();
  } catch {
    pendingScrollAfterSend.value = false;
  }
}
</script>

<template>
  <section
    class="rounded-lg border border-default bg-default p-4"
    :class="sectionClass"
  >
    <div class="flex items-center justify-between gap-2">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-muted">
        Actividad y chat
      </h3>
      <span class="text-xs text-muted">{{ messageCountLabel }}</span>
    </div>

    <div
      ref="scrollContainerRef"
      class="space-y-3 overflow-y-auto rounded-lg border border-default bg-muted/20 p-3"
      :class="scrollAreaClass"
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
        :rows="1"
        :max-rows="1"
        class="min-w-0 flex-1"
        placeholder="Escribe un mensaje o actualización del servicio..."
        autoresize
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
  </section>
</template>
