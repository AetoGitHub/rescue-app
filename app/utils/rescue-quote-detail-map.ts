import { catalogDropdownSelection } from '~/interfaces/shared/catalog-dropdown.interface';
import type { RescueQuoteLine } from '~/interfaces/rescue';
import type { RescueCompanySettings } from '~/interfaces/rescue/company-settings';
import type { RescueQuoteDetail } from '~/interfaces/rescue/quote';
import { parseQuoteLineBlameDataRaw } from '~/utils/quote-line-price-sync';
import { roundQuoteMoney } from '~/utils/quote-pricing';
import { findContractItemForService } from '~/utils/rescue-company-settings';
import { emptyQuoteLinePriceFields } from '~/utils/rescue-quote-lines';

function parseApiMoney(value: string | null | undefined): number {
  if (value == null) return 0;
  const parsed = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function inferQuoteLineContractItemId(
  serviceId: number | null,
  settings: RescueCompanySettings | null | undefined,
): number | null {
  if (serviceId == null) return null;
  return findContractItemForService(settings, serviceId)?.id ?? null;
}

export function mapRescueQuoteDetailFromApi(
  detail: RescueQuoteDetail,
  settings?: RescueCompanySettings | null,
): RescueQuoteLine[] {
  return detail.services.map((service) => {
    const quantity = Math.trunc(service.quantity);
    const realCost = parseApiMoney(service.real_cost);
    const unitCost =
      quantity > 0 ? roundQuoteMoney(realCost / quantity) : 0;
    const fromApplied =
      service.applied_price != null
        ? parseApiMoney(service.applied_price)
        : 0;
    const fromPreTotal = parseApiMoney(service.pre_total);
    const fromTotal = parseApiMoney(service.total);
    const appliedPrice =
      fromApplied > 0
        ? fromApplied
        : fromPreTotal > 0
          ? fromPreTotal
          : fromTotal;
    const fromClientPrice = parseApiMoney(service.client_price);
    const blame = parseQuoteLineBlameDataRaw(service.blame_data_raw);

    return {
      id: String(service.id),
      service: catalogDropdownSelection(
        service.service_id,
        String(service.service_name ?? ''),
      ),
      quantity,
      unit_cost: unitCost,
      contract_item_id: inferQuoteLineContractItemId(
        service.service_id,
        settings,
      ),
      ...emptyQuoteLinePriceFields(),
      applied_price: appliedPrice,
      client_price: fromClientPrice,
      priceOverrideSource: blame.priceOverrideSource,
      blame_client_price: blame.blame_client_price,
      blame_applied_price: blame.blame_applied_price,
    };
  });
}
