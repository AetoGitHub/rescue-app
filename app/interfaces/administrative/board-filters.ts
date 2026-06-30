import type { AdministrativeBillingStatus, AdministrativeEligibleOperativeStatus  } from '~/constants/administrative-kanban';

import type { RescueServiceType } from '~/interfaces/rescue';

export interface AdministrativeBoardFilters {
  folio: string;
  createdFrom: string;
  createdTo: string;
  serviceTypes: RescueServiceType[];
  operativeStatus: AdministrativeEligibleOperativeStatus | null;
  billingStatus: AdministrativeBillingStatus | null;
  companyId: number | null;
  managerId: number | null;
  sellerId: number | null;
}
