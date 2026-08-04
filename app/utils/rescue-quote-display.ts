import type { RescueQuoteDetail } from '~/interfaces/rescue/quote';
import { parseRescueCardMoney } from '~/utils/operational-rescue-card';
import { roundQuoteMoney } from '~/utils/quote-pricing';

export interface RescueQuoteDisplaySummary {
  technicalCost: number;
  subTotal: number;
  profit: number;
  commissions: number;
  ivaPercent: number;
  ivaAmount: number;
  total: number;
}

/** Totals for read-only quote views (closed / PDF-style detail). */
export function summarizeRescueQuoteDetail(
  detail: Pick<
    RescueQuoteDetail,
    'technical_cost' | 'sub_total' | 'total' | 'iva' | 'comissions_apply'
  >,
): RescueQuoteDisplaySummary {
  const technicalCost = parseRescueCardMoney(detail.technical_cost);
  const subTotal = parseRescueCardMoney(detail.sub_total);
  const total = parseRescueCardMoney(detail.total);
  const commissions = parseRescueCardMoney(detail.comissions_apply);
  const ivaPercent = Number.isFinite(detail.iva) ? detail.iva : 0;

  return {
    technicalCost,
    subTotal,
    profit: roundQuoteMoney(subTotal - technicalCost),
    commissions,
    ivaPercent,
    ivaAmount: roundQuoteMoney(total - subTotal),
    total,
  };
}
