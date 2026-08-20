import { accessAdministrative } from '#shared/abilities';
import type { TmsPurchaseOrderUploadResponse } from '~/interfaces/portals/tms';
import { forwardFetchError } from '../../../../utils/forward-fetch-error';
import {
  normalizePurchaseOrderUploadResponse,
  parsePurchaseOrderPdfParts,
  purchaseOrderPartsToFormData,
  resolvePurchaseOrderUploadUrl,
} from '../../../../utils/purchase-order-upload';

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  await authorize(event, accessAdministrative);

  const parts = parsePurchaseOrderPdfParts(await readMultipartFormData(event));
  const body = purchaseOrderPartsToFormData(parts);

  try {
    const response = await $fetch<TmsPurchaseOrderUploadResponse>(
      resolvePurchaseOrderUploadUrl(),
      {
        method: 'POST',
        body,
      },
    );
    setResponseStatus(event, 201);
    return normalizePurchaseOrderUploadResponse(response);
  } catch (error) {
    forwardFetchError(error);
  }
});
