import { roundQuoteToNearestTen } from '~/utils/quote-pricing';
import { formatRescueCardMoney } from '~/utils/operational-rescue-card';

export function computeAdvanceAmountFromPercent(
  quoteTotal: number,
  percent: number,
): number {
  if (quoteTotal <= 0 || percent <= 0) return 0;
  const raw = (quoteTotal * percent) / 100;
  return roundQuoteToNearestTen(raw);
}

export function formatAdvanceAmountForInput(amount: number): string {
  return amount.toFixed(2);
}

/** API expects decimal strings, e.g. `"500.00"`. */
export function formatAdvanceAmountForApi(
  value: string | number | null | undefined,
): string {
  return formatAdvanceAmountForInput(parseAdvanceAmountValue(value));
}

export function parseAdvanceAmountValue(
  value: string | number | null | undefined,
): number {
  if (value == null) return 0;
  const parsed = Number(String(value).trim().replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getAdvancePercentPreview(
  quoteTotal: number,
  percent: number,
): string {
  return formatRescueCardMoney(
    computeAdvanceAmountFromPercent(quoteTotal, percent),
  );
}
