import type { RescueQuoteLine, RescueServiceType } from '~/interfaces/rescue';
import { isQuoteOptionalForServiceType } from '~/utils/rescue-request';

export function createEmptyQuoteLine(): RescueQuoteLine {
  return {
    id: crypto.randomUUID(),
    service_id: null,
    service_label: '',
    quantity: 1,
    unit_cost: 0,
    contract_item_id: null,
  };
}

export function emptyQuoteLines(): RescueQuoteLine[] {
  return [createEmptyQuoteLine()];
}

export function initialQuoteLinesForServiceType(
  serviceType: RescueServiceType,
): RescueQuoteLine[] {
  return isQuoteOptionalForServiceType(serviceType) ? [] : emptyQuoteLines();
}
