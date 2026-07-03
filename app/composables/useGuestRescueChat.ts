import type { MaybeRefOrGetter, Ref } from 'vue';
import type { RescueChatMessage } from '~/interfaces/rescue';
import { GUEST_MOCK_AUTHOR_ID } from '~/mocks/guest-rescue-authorize';

export function useGuestRescueChat(
  messages: Ref<RescueChatMessage[]>,
  guestAuthorId: MaybeRefOrGetter<number> = GUEST_MOCK_AUTHOR_ID,
) {
  const toast = useToast();
  const isSending = ref(false);

  const authorId = computed(() => toValue(guestAuthorId));

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isSending.value) return;

    isSending.value = true;

    try {
      // Fase 2: POST /api/guest/authorize/{token}/messages/create/
      await new Promise((resolve) => {
        setTimeout(resolve, 150);
      });

      const nextId =
        messages.value.reduce((max, message) => Math.max(max, message.id), 0) + 1;

      messages.value = [
        ...messages.value,
        {
          id: nextId,
          type: 'user',
          text: trimmed,
          created_at: new Date().toISOString(),
          created_by_id: authorId.value,
          created_by_name: 'Autorizador invitado',
          response_to_id: null,
        },
      ];
    } catch (error) {
      toast.add({
        title: 'No se pudo enviar el mensaje',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
      throw error;
    } finally {
      isSending.value = false;
    }
  }

  return {
    sendMessage,
    isSending: computed(() => isSending.value),
  };
}
