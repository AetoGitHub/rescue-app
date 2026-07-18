import type { CatalogDropdownSelection } from '~/interfaces/shared/catalog-dropdown.interface';

export type {
  RescueChatMessage,
  RescueChatMessageCreateBody,
  RescueChatMessageCreateResponse,
  RescueChatMessageType,
} from './chat';

export type { RescueCardDetail } from './detail';

export type {
  RescueEvidence,
  RescueEvidenceCreateBody,
  RescueEvidenceItemInput,
  RescueEvidenceType,
} from './evidence';

export type {
  RescueAdvanceFormState,
  RescueAdvancePanelMode,
  RescueFooterAction,
  RescueOperativeActionId,
  RescueOperativeFlowContext,
  RescueOperativeUpdateBody,
  RescueServiceCompletedFormState,
  RescueSupplierRatingRow,
} from './operative';

export type { RescueGeneralSettings } from './settings';
export { RESCUE_GENERAL_SETTINGS_PATH } from './settings';

export type {
  RescueCard,
  RescueCardApproved,
  RescueCardBase,
  RescueCardClosed,
  RescueCardInProgress,
  RescueCardWaitingAdvance,
} from './card';

export type RescueServiceType =
  | 'rescue'
  | 'loan'
  | 'proyect'
  | 'direct_budget';

export type RescueSupplierSort = 'distance' | 'ranking' | 'name';

export interface RescueSupplierNearbyRow {
  id: number;
  name: string;
  phone: string;
  is_trusted: boolean;
  score: number;
  rescues_count: number;
  /** Alias of score for templates */
  ranking: number;
  distance_km: number | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  service_type: import('~/interfaces/catalogs/supplier').SupplierServiceType[];
}

export interface SupplierMapPin {
  lat: number;
  lng: number;
  name: string;
}

export interface RescueQuoteLine {
  id: string;
  service: CatalogDropdownSelection;
  quantity: number;
  unit_cost: number;
  /** Set when the line uses a contract/convenio item variant. */
  contract_item_id: number | null;
  /**
   * Precio a aplicar for this line (before per-line $10 rounding).
   * When 0 / unset, pricing uses the calculated line total.
   */
  applied_price: number;
}

export interface RescueCreateBody {
  service_type: RescueServiceType;
  client: number;
  general_public: boolean;
  serial_number?: string;
  service_description: string;
  supplier: number | null;
  operator?: number | null;
  location_latitude: string | null;
  location_longitude: string | null;
  location_description: string;
  internal_notes: string;
}

export interface RescueCreateResponse {
  id: number;
  folio: string;
}
