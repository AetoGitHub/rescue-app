import { DEFAULT_QUOTE_MARGIN_RATE } from '~/constants/quote-pricing';
import type { RescueQuoteLine } from '~/interfaces/rescue';

export function roundUpToNearestTen(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.ceil(value / 10) * 10;
}

export interface QuoteLineTotals {
  costSubtotal: number;
  withMargin: number;
  lineTotal: number;
  roundingAdjustment: number;
}

export function computeQuoteLineTotals(
  line: Pick<RescueQuoteLine, 'quantity' | 'unit_cost'>,
  marginRate = DEFAULT_QUOTE_MARGIN_RATE,
): QuoteLineTotals {
  const qty = Number.isFinite(line.quantity) ? line.quantity : 0;
  const unit = Number.isFinite(line.unit_cost) ? line.unit_cost : 0;
  const costSubtotal = qty * unit;
  const withMargin = costSubtotal * (1 + marginRate);
  const lineTotal = roundUpToNearestTen(withMargin);
  const roundingAdjustment = lineTotal - withMargin;

  return {
    costSubtotal,
    withMargin,
    lineTotal,
    roundingAdjustment,
  };
}

export interface QuoteLineSummaryRow extends QuoteLineTotals {
  line: RescueQuoteLine;
}

export interface QuoteSummary {
  costSubtotal: number;
  totalCharged: number;
  roundingAdjustment: number;
  lines: QuoteLineSummaryRow[];
}

export function computeQuoteSummary(
  lines: RescueQuoteLine[],
  marginRate = DEFAULT_QUOTE_MARGIN_RATE,
): QuoteSummary {
  const rows = lines.map((line) => {
    const totals = computeQuoteLineTotals(line, marginRate);
    return { line, ...totals };
  });

  const costSubtotal = rows.reduce((sum, r) => sum + r.costSubtotal, 0);
  const totalCharged = rows.reduce((sum, r) => sum + r.lineTotal, 0);
  const withMarginSum = rows.reduce((sum, r) => sum + r.withMargin, 0);

  return {
    costSubtotal,
    totalCharged,
    roundingAdjustment: totalCharged - withMarginSum,
    lines: rows,
  };
}

export function formatQuoteMoney(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  }).format(value);
}
