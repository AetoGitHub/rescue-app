import { useMutation, useQueryCache } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import { RESCUE_GUEST_CHAT_MESSAGE_CREATE_PATH } from '~/constants/rescue-approve-link-api';
import type {
  RescueChatMessageCreateBody,
  RescueChatMessageCreateResponse,
} from '~/interfaces/rescue';
import { guestRescueChatQueryKey } from '~/utils/guest-rescue-chat';

export function useGuestRescueChatSendMessage(
  rescueId: MaybeRefOrGetter<number | null>,
  token: MaybeRefOrGetter<string | null>,
  options?: { enabled?: MaybeRefOrGetter<boolean> },
) {
  const queryCache = useQueryCache();
  const toast = useToast();
  const id = computed(() => toValue(rescueId));
  const tokenValue = computed(() => toValue(token)?.trim() ?? '');
  const ownMessageIds = ref<Set<number>>(new Set());

  const enabledRef = computed(() => {
    if (id.value == null || !tokenValue.value) return false;
    const extra = options?.enabled;
    if (extra == null) return true;
    return toValue(extra);
  });

  const { mutateAsync, asyncStatus } = useMutation({
    mutation: (text: string) => {
      const currentId = id.value;
      const currentToken = tokenValue.value;
      if (currentId == null || !currentToken) {
        return Promise.reject(new Error('Enlace no válido o expirado'));
      }

      const body: RescueChatMessageCreateBody = {
        text: text.trim(),
        response_to: null,
      };

      return guestApiFetch<RescueChatMessageCreateResponse>(
        RESCUE_GUEST_CHAT_MESSAGE_CREATE_PATH(currentId, currentToken),
        {
          method: 'POST',
          body,
        },
      );
    },
    onSuccess: async (response) => {
      const currentId = id.value;
      const currentToken = tokenValue.value;
      if (currentId != null && currentToken) {
        ownMessageIds.value = new Set([
          ...ownMessageIds.value,
          response.id,
        ]);
        await queryCache.invalidateQueries({
          key: guestRescueChatQueryKey(currentId, currentToken),
        });
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

  const isSending = computed(
    () => enabledRef.value && asyncStatus.value === 'loading',
  );

  async function sendMessageAsync(text: string) {
    if (!enabledRef.value) return;
    await mutateAsync(text);
  }

  function isOwnGuestMessage(messageId: number): boolean {
    return ownMessageIds.value.has(messageId);
  }

  return {
    sendMessageAsync,
    isSending,
    ownMessageIds: computed(() => ownMessageIds.value),
    isOwnGuestMessage,
  };
}
