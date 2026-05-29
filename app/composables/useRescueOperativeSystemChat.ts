import { useQueryCache } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import { RESCUE_CHAT_MESSAGE_CREATE_PATH } from '~/constants/rescue-chat-api';
import type { RescueChatMessageCreateResponse } from '~/interfaces/rescue';
import { formatRescueCardMoney } from '~/utils/operational-rescue-card';
import { parseAdvanceAmountValue } from '~/utils/advance-amount';

export function useRescueOperativeSystemChat(
  rescueId: MaybeRefOrGetter<number | null>,
) {
  const apiFetch = useApiFetch();
  const queryCache = useQueryCache();
  const toast = useToast();
  const id = computed(() => toValue(rescueId));

  async function postSystemMessage(text: string, options?: { silent?: boolean }) {
    const currentId = id.value;
    if (currentId == null) return;

    try {
      await apiFetch<RescueChatMessageCreateResponse>(
        RESCUE_CHAT_MESSAGE_CREATE_PATH(currentId),
        {
          method: 'POST',
          body: {
            text: text.trim(),
            response_to: null,
          },
        },
      );
      await invalidateRescueDataAfterChatMessage(queryCache, currentId);
    } catch (error) {
      if (!options?.silent) {
        toast.add({
          title: 'No se pudo registrar el mensaje en el chat',
          description: getFetchErrorMessage(error),
          color: 'error',
        });
      }
      throw error;
    }
  }

  function managerLabel(name: string | null | undefined): string {
    const trimmed = name?.trim();
    return trimmed || 'Gestor';
  }

  async function postAdvanceRequiredMessage(
    amount: string | number,
    managerName: string | null | undefined,
    options?: { silent?: boolean },
  ) {
    const formatted = formatRescueCardMoney(parseAdvanceAmountValue(amount));
    const label = managerLabel(managerName);
    await postSystemMessage(
      `Anticipo requerido: ${formatted} solicitado por ${label}`,
      { silent: true, ...options },
    );
    // TODO: notifyAdmins when RESCUE_NOTIFY_ADMINS_PATH is defined
  }

  async function postAdvanceModifiedMessage(
    amount: string | number,
    managerName: string | null | undefined,
    options?: { silent?: boolean },
  ) {
    const formatted = formatRescueCardMoney(parseAdvanceAmountValue(amount));
    const label = managerLabel(managerName);
    await postSystemMessage(
      `Monto de anticipo modificado a ${formatted} por ${label}`,
      { silent: true, ...options },
    );
  }

  return {
    postAdvanceRequiredMessage,
    postAdvanceModifiedMessage,
  };
}
