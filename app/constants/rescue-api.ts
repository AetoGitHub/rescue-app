/** Operational kanban cards (required `status` per column). */
export const RESCUE_CARDS_PATH = '/api/rescue/cards/';

/** Operational flat list (optional `status`, cursor pagination). */
export const RESCUE_LIST_PATH = '/api/rescue/list/';

/** Partial update: vehicle, service_description, internal_notes only. */
export const RESCUE_UPDATE_PATH = (rescueId: number) =>
  `/api/rescue/update/${rescueId}/`;

/** Supplier list used by catalog CRUD and rescue request step 3 mockup. */
export const SUPPLIER_LIST_PATH = '/api/supplier/list/';

/**
 * Map-bounds supplier list for admin catalog map view and rescue supplier search.
 * Query: north, south, east, west (required), hash, zoom (optional), filters.
 * Response: PaginatedResponse<SupplierListItem>.
 */
export const SUPPLIER_MAP_PATH = '/api/supplier/map/';

/** Search radius (km) around unit location for rescue supplier map queries. */
export const SUPPLIER_RESCUE_SEARCH_RADIUS_KM = 50;

export const SUPPLIER_REVIEW_CREATE_PATH = (supplierId: number) =>
  `/api/supplier/${supplierId}/review/create/`;
