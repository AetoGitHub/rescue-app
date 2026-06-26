/** Supplier list used by catalog CRUD and rescue request step 3 mockup. */
export const SUPPLIER_LIST_PATH = '/api/supplier/list/';

export const SUPPLIER_REVIEW_CREATE_PATH = (supplierId: number) =>
  `/api/supplier/${supplierId}/review/create/`;
