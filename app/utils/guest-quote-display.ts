import {
  formatRescueCardMoney,
  parseRescueCardMoney,
} from '~/utils/operational-rescue-card';

/**
 * Precio unitario para vista invitado: total de línea (con comisiones) / cantidad.
 */
export function guestQuoteDisplayUnitPrice(
  lineTotal: string | number,
  quantity: number,
): string {
  const total = parseRescueCardMoney(lineTotal);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return formatRescueCardMoney(0);
  }
  return formatRescueCardMoney(total / quantity);
}
