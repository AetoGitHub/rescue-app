import {
  formatRescueCardMoney,
  parseRescueCardMoney,
} from '~/utils/operational-rescue-card';

/**
 * Precio unitario para vista invitado.
 * Prefers persisted venta AETO (`client_price`); otherwise total / cantidad.
 */
export function guestQuoteDisplayUnitPrice(
  lineTotal: string | number,
  quantity: number,
  clientPrice?: string | number | null,
): string {
  if (clientPrice != null && String(clientPrice).trim() !== '') {
    return formatRescueCardMoney(clientPrice);
  }
  const total = parseRescueCardMoney(lineTotal);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return formatRescueCardMoney(0);
  }
  return formatRescueCardMoney(total / quantity);
}
