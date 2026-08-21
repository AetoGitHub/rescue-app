import type { TmsPurchaseOrderUploadResponse } from '~/interfaces/portals/tms';
import { TMS_PURCHASE_ORDER_UPLOAD_PATH } from '~/constants/tms-portal-api';

export function useTmsPurchaseOrderUpload() {
  const apiFetch = useApiFetch();

  function uploadPurchaseOrders(files: File[]) {
    const body = new FormData();
    for (const file of files) body.append('files', file);

    return apiFetch<TmsPurchaseOrderUploadResponse>(
      TMS_PURCHASE_ORDER_UPLOAD_PATH,
      { method: 'POST', body },
    );
  }

  return { uploadPurchaseOrders };
}
