import type { OperationalRescueStatus } from '~/constants/operational-kanban';
import type { RescueServiceType } from '~/interfaces/rescue';

export interface OperationalBoardFilters {
  folio: string;
  serviceTypes: RescueServiceType[];
  operativeStatus: OperationalRescueStatus | null;
  companyId: number | null;
  managerId: number | null;
  pendingAdvance: boolean;
  slaAlert: boolean;
  commentAlert: boolean;
}
