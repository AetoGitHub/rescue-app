import type { ClientCreditSnapshot } from '~/schemas/rescue-create';
import type { RescueQuoteLine } from '~/interfaces/rescue';
import { formatClientMoney } from '~/utils/client-list-display';
import { isFilledQuoteLine } from '~/utils/quote-pricing';

export type ClientQuoteCreditWarning = {
  title: string;
  description: string;
};

export function quoteLinesHaveFilledEntries(lines: RescueQuoteLine[]): boolean {
  return lines.some((line) => isFilledQuoteLine(line));
}

export function getClientQuoteCreditWarning(
  snapshot: ClientCreditSnapshot | null | undefined,
  totalCharged: number,
  hasFilledLines: boolean,
): ClientQuoteCreditWarning | null {
  if (!hasFilledLines || totalCharged <= 0) return null;
  if (snapshot?.client_type !== 'CREDIT') return null;

  const available = snapshot.credit_available;
  if (available == null || !Number.isFinite(available)) return null;
  if (totalCharged <= available) return null;

  return {
    title: 'Crédito insuficiente',
    description: `El total cotizado (${formatClientMoney(totalCharged)}) excede el crédito disponible (${formatClientMoney(available)}).`,
  };
}

export function getWizardQuoteCreditWarning(
  snapshot: ClientCreditSnapshot | null | undefined,
  quoteLines: RescueQuoteLine[],
  companySettings: Parameters<typeof computeQuotePricing>[1],
): ClientQuoteCreditWarning | null {
  const hasFilledLines = quoteLinesHaveFilledEntries(quoteLines);
  if (!hasFilledLines) return null;

  const pricing = computeQuotePricing(quoteLines, companySettings);
  return getClientQuoteCreditWarning(
    snapshot,
    pricing.totalCharged,
    hasFilledLines,
  );
}
