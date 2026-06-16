import { DEFAULT_IVA_RATE } from '~/constants/quote-pricing';
import type { RescueQuoteLine } from '~/interfaces/rescue';
import type {
  RescueQuoteCreateBody,
  RescueQuoteServiceCreateBody,
  RescueQuoteUpdateBody,
} from '~/interfaces/rescue/quote';
import type { RescueCompanySettings } from '~/interfaces/rescue/company-settings';
import {
  computeQuotePricing,
  isFilledQuoteLine,
  roundQuoteMoney,
  type QuoteLinePricing,
  type QuotePricingOptions,
} from '~/utils/quote-pricing';

export function formatQuoteDecimal(value: number): string {
  return roundQuoteMoney(value).toFixed(2);
}

function linePercentajeApply(
  row: QuoteLinePricing,
  commissionFixedPool: number,
): string {
  if (row.isContractLine || commissionFixedPool <= 0) {
    return '0.00';
  }
  const share = row.fixedShare;
  if (share <= 0) {
    return '0.00';
  }
  return formatQuoteDecimal((share / commissionFixedPool) * 100);
}

function mapServiceLine(
  row: QuoteLinePricing,
  commissionFixedPool: number,
): RescueQuoteServiceCreateBody {
  const { line } = row;
  return {
    service: line.service_id as number,
    quantity: Math.trunc(line.quantity),
    real_cost: formatQuoteDecimal(row.costSubtotal),
    pre_total: formatQuoteDecimal(row.lineTotalCalculated),
    percenaje_apply: linePercentajeApply(row, commissionFixedPool),
    amount_applied: formatQuoteDecimal(row.fixedShare),
    amount_rounded: formatQuoteDecimal(row.roundingAdd),
    total: formatQuoteDecimal(row.lineTotal),
  };
}

export function buildRescueQuoteCreateBody(
  rescueId: number,
  lines: RescueQuoteLine[],
  settings: RescueCompanySettings | null | undefined,
  options: QuotePricingOptions = {},
): RescueQuoteCreateBody | null {
  const pricing = computeQuotePricing(lines, settings, options);
  const filledRows = pricing.lines.filter((row) => isFilledQuoteLine(row.line));

  if (filledRows.length === 0) {
    return null;
  }

  const commissions = settings?.commissions ?? {
    commission_type: 'PERCENTAGE' as const,
    commission_value: 0,
    commission_fixed: 0,
    price_multiplier: 1,
  };
  const commissionFixedPool = commissions.commission_fixed;
  const ivaRate = options.ivaRate ?? DEFAULT_IVA_RATE;
  const ivaPercent = Math.round(ivaRate * 100);

  const body: RescueQuoteCreateBody = {
    rescue: rescueId,
    technical_cost: formatQuoteDecimal(pricing.costSubtotal),
    sub_total: formatQuoteDecimal(pricing.totalBeforeTax),
    total: formatQuoteDecimal(pricing.totalCharged),
    seller_commission_type: commissions.commission_type,
    seller_commission_value: formatQuoteDecimal(commissions.commission_value),
    seller_commission_fixed: formatQuoteDecimal(commissions.commission_fixed),
    iva: ivaPercent === 8 || ivaPercent === 16 ? ivaPercent : 16,
    services: filledRows.map((row) =>
      mapServiceLine(row, commissionFixedPool),
    ),
  };

  if (pricing.sellerCommission > 0.001) {
    body.comissions_apply = formatQuoteDecimal(pricing.sellerCommission);
  }

  return body;
}

export function buildRescueQuoteUpdateBody(
  lines: RescueQuoteLine[],
  settings: RescueCompanySettings | null | undefined,
  options: QuotePricingOptions = {},
): RescueQuoteUpdateBody | null {
  const createBody = buildRescueQuoteCreateBody(0, lines, settings, options);
  if (createBody == null) return null;

  const { rescue: _rescue, ...updateBody } = createBody;
  return updateBody;
}
