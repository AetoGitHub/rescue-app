import { useMutation, useQueryCache } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import type {
  RescueChatMessageCreateBody,
  RescueChatMessageCreateResponse,
} from '~/interfaces/rescue';

export function useRescueChatSendMessage(rescueId: MaybeRefOrGetter<number | null>) {
  const apiFetch = useApiFetch();
  const queryCache = useQueryCache();
  const toast = useToast();
  const id = computed(() => toValue(rescueId));

  const { mutate, mutateAsync, asyncStatus } = useMutation({
    mutation: (text: string) => {
      const body: RescueChatMessageCreateBody = {
        text: text.trim(),
        response_to: null,
      };

      return apiFetch<RescueChatMessageCreateResponse>(
        `/api/chat/${id.value}/messages/create/`,
        {
          method: 'POST',
          body,
        },
      );
    },
    onSuccess: async () => {
      await queryCache.invalidateQueries({
        key: ['rescue-chat-messages', id.value],
      });
      toast.add({
        title: 'Mensaje enviado',
        color: 'success',
      });
    },
    onError: (error) => {
      toast.add({
        title: 'No se pudo enviar el mensaje',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
    },
  });

  const isSending = computed(() => asyncStatus.value === 'loading');

  return {
    sendMessage: mutate,
    sendMessageAsync: mutateAsync,
    isSending,
  };
}
