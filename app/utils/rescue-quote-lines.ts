import { emptyCatalogDropdownSelection } from '~/interfaces/shared/catalog-dropdown.interface';
import type { RescueQuoteLine, RescueServiceType } from '~/interfaces/rescue';
import { isQuoteOptionalForServiceType } from '~/utils/rescue-request';

export function emptyQuoteLinePriceFields(): Pick<
  RescueQuoteLine,
  | 'applied_price'
  | 'client_price'
  | 'priceOverrideSource'
  | 'blame_client_price'
  | 'blame_applied_price'
> {
  return {
    applied_price: 0,
    client_price: 0,
    priceOverrideSource: 'none',
    blame_client_price: null,
    blame_applied_price: null,
  };
}

export function createEmptyQuoteLine(): RescueQuoteLine {
  return {
    id: crypto.randomUUID(),
    service: emptyCatalogDropdownSelection(),
    quantity: 1,
    unit_cost: 0,
    contract_item_id: null,
    ...emptyQuoteLinePriceFields(),
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
