<script setup lang="ts">
const props = defineProps<{
  rescueId: number;
}>();

const messageText = ref('');

const { sendMessageAsync, isSending } = useRescueChatSendMessage(
  () => props.rescueId,
);

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

function onInputKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    void submitMessage();
  }
}
</script>

<template>
  <div
    class="flex items-center gap-1.5"
    @click.stop
  >
    <UInput
      v-model="messageText"
      class="min-w-0 flex-1"
      placeholder="Mensaje rápido…"
      size="sm"
      :disabled="isSending"
      @keydown="onInputKeydown"
    />
    <UButton
      color="primary"
      icon="i-lucide-send"
      size="sm"
      :loading="isSending"
      :disabled="!messageText.trim()"
      aria-label="Enviar mensaje"
      @click="submitMessage"
    />
  </div>
</template>
