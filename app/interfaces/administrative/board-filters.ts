import type { AdministrativeBillingStatus } from '~/constants/administrative-kanban';
import type { AdministrativeEligibleOperativeStatus } from '~/constants/administrative-kanban';
import type { RescueServiceType } from '~/interfaces/rescue';

export interface AdministrativeBoardFilters {
  folio: string;
  createdFrom: string;
  createdTo: string;
  serviceTypes: RescueServiceType[];
  operativeStatuses: AdministrativeEligibleOperativeStatus[];
  billingStatuses: AdministrativeBillingStatus[];
  companyId: number | null;
  managerId: number | null;
  sellerId: number | null;
}
