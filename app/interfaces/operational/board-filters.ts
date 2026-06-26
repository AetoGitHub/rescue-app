import type { RescueServiceType } from '~/interfaces/rescue';

export interface OperationalBoardFilters {
  folio: string;
  serviceTypes: RescueServiceType[];
  companyId: number | null;
  managerId: number | null;
  pendingAdvance: boolean;
  slaAlert: boolean;
  commentAlert: boolean;
}
