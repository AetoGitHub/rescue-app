import type { OperationalRescueStatus } from '~/constants/operational-kanban';
import type { RescueServiceType } from '~/interfaces/rescue';
import type { CatalogDropdownSelection } from '~/interfaces/shared/catalog-dropdown.interface';

export interface OperationalBoardFilters {
  folio: string;
  serviceTypes: RescueServiceType[];
  operativeStatus: OperationalRescueStatus | null;
  company: CatalogDropdownSelection;
  manager: CatalogDropdownSelection;
  client: CatalogDropdownSelection;
  pendingAdvance: boolean;
  slaAlert: boolean;
  commentAlert: boolean;
}
