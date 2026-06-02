import type { MaybeRefOrGetter } from 'vue';

// PENDING: los mensajes de anticipo los registra el backend al procesar
// request_advance / modify_advance_amount. Reactivar el bloque comentado abajo
// solo si el backend no los genera automáticamente.

export function useRescueOperativeSystemChat(
  _rescueId: MaybeRefOrGetter<number | null>,
) {
  async function postAdvanceRequiredMessage(
    _amount: string | number,
    _managerName: string | null | undefined,
    _options?: { silent?: boolean },
  ) {
    return;
  }

  async function postAdvanceModifiedMessage(
    _amount: string | number,
    _managerName: string | null | undefined,
    _options?: { silent?: boolean },
  ) {
    return;
  }

  return {
    postAdvanceRequiredMessage,
    postAdvanceModifiedMessage,
  };
}

/*
import { useQueryCache } from '@pinia/colada';
import { RESCUE_CHAT_MESSAGE_CREATE_PATH } from '~/constants/rescue-chat-api';
import type { RescueChatMessageCreateResponse } from '~/interfaces/rescue';
import { formatRescueCardMoney } from '~/utils/operational-rescue-card';
import { parseAdvanceAmountValue } from '~/utils/advance-amount';

async function postSystemMessage(text: string, options?: { silent?: boolean }) {
  ...
}

async function postAdvanceRequiredMessage(amount, managerName, options) {
  const formatted = formatRescueCardMoney(parseAdvanceAmountValue(amount));
  const label = managerLabel(managerName);
  await postSystemMessage(
    `Anticipo requerido: ${formatted} solicitado por ${label}`,
    { silent: true, ...options },
  );
}

async function postAdvanceModifiedMessage(amount, managerName, options) {
  const formatted = formatRescueCardMoney(parseAdvanceAmountValue(amount));
  const label = managerLabel(managerName);
  await postSystemMessage(
    `Monto de anticipo modificado a ${formatted} por ${label}`,
    { silent: true, ...options },
  );
}
*/
