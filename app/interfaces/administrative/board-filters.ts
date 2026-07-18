import type { AdministrativeBillingStatus, AdministrativeEligibleOperativeStatus  } from '~/constants/administrative-kanban';

import type { RescueServiceType } from '~/interfaces/rescue';
import type { CatalogDropdownSelection } from '~/interfaces/shared/catalog-dropdown.interface';

export interface AdministrativeBoardFilters {
  folio: string;
  createdFrom: string;
  createdTo: string;
  serviceTypes: RescueServiceType[];
  operativeStatus: AdministrativeEligibleOperativeStatus | null;
  billingStatus: AdministrativeBillingStatus | null;
  company: CatalogDropdownSelection;
  manager: CatalogDropdownSelection;
  seller: CatalogDropdownSelection;
  client: CatalogDropdownSelection;
}
