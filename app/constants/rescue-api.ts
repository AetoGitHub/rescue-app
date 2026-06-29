/** Operational kanban cards (required `status` per column). */
export const RESCUE_CARDS_PATH = '/api/rescue/cards/';

/** Operational flat list (optional `status`, cursor pagination). */
export const RESCUE_LIST_PATH = '/api/rescue/list/';

/** Supplier list used by catalog CRUD and rescue request step 3 mockup. */
export const SUPPLIER_LIST_PATH = '/api/supplier/list/';

export const SUPPLIER_REVIEW_CREATE_PATH = (supplierId: number) =>
  `/api/supplier/${supplierId}/review/create/`;
