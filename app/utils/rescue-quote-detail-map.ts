import type { RescueQuoteLine } from '~/interfaces/rescue';
import type { RescueCompanySettings } from '~/interfaces/rescue/company-settings';
import type { RescueQuoteDetail } from '~/interfaces/rescue/quote';
import { roundQuoteMoney } from '~/utils/quote-pricing';
import { findContractItemForService } from '~/utils/rescue-company-settings';

function parseApiMoney(value: string): number {
  const parsed = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function inferContractItemId(
  serviceId: number,
  unitCost: number,
  settings: RescueCompanySettings | null | undefined,
): number | null {
  const item = findContractItemForService(settings, serviceId);
  if (item == null) return null;
  if (roundQuoteMoney(item.price) !== roundQuoteMoney(unitCost)) return null;
  return item.id;
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

    return {
      id: crypto.randomUUID(),
      service_id: service.service_id,
      service_label: String(service.service_name ?? '').trim(),
      quantity,
      unit_cost: unitCost,
      contract_item_id: inferContractItemId(
        service.service_id,
        unitCost,
        settings,
      ),
    };
  });
}
