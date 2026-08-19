import { useMutation, useQueryCache } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import { RESCUE_CHAT_MESSAGE_CREATE_PATH } from '~/constants/rescue-chat-api';
import type {
  RescueChatMessageCreateBody,
  RescueChatMessageCreateResponse,
} from '~/interfaces/rescue';

export function useRescueChatSendMessage(rescueId: MaybeRefOrGetter<number | null>) {
  const apiFetch = useApiFetch();
  const queryCache = useQueryCache();
  const toast = useToast();
  const id = computed(() => toValue(rescueId));

  const { mutateAsync, asyncStatus } = useMutation({
    mutation: (text: string) => {
      const currentId = id.value;
      if (currentId == null) {
        return Promise.reject(new Error('Sin solicitud seleccionada'));
      }

      const body: RescueChatMessageCreateBody = {
        text: text.trim(),
        response_to: null,
      };

      return apiFetch<RescueChatMessageCreateResponse>(
        RESCUE_CHAT_MESSAGE_CREATE_PATH(currentId),
        {
          method: 'POST',
          body,
        },
      );
    },
    onSuccess: async () => {
      const currentId = id.value;
      if (currentId != null) {
        await invalidateRescueDataAfterChatMessage(queryCache, currentId);
      }
    },
    onError: (error) => {
      toast.add({
        title: 'No se pudo enviar el mensaje',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
    },
  });

  const sendLocked = ref(false);
  const isSending = computed(
    () => sendLocked.value || asyncStatus.value === 'loading',
  );

  function sendMessage(text: string) {
    void sendMessageAsync(text);
  }

  async function sendMessageAsync(text: string) {
    if (isSending.value) return;
    sendLocked.value = true;
    try {
      return await mutateAsync(text);
    } finally {
      sendLocked.value = false;
    }
  }

  return {
    sendMessage,
    sendMessageAsync,
    isSending,
  };
}
