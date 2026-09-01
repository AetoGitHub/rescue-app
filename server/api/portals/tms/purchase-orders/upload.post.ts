import { accessAdministrative } from '#shared/abilities';
import { TMS_PURCHASE_ORDER_UPLOAD_TIMEOUT_MS } from '~/constants/tms-portal-api';
import { forwardFetchError } from '../../../../utils/forward-fetch-error';
import {
  normalizePurchaseOrderJobAccepted,
  parsePurchaseOrderPdfParts,
  purchaseOrderPartsToFormData,
  resolvePurchaseOrderUploadUrl,
} from '../../../../utils/purchase-order-upload';

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  await authorize(event, accessAdministrative);

  const { accepted } = parsePurchaseOrderPdfParts(
    await readMultipartFormData(event),
  );
  const body = purchaseOrderPartsToFormData(accepted);

  try {
    const response = await $fetch(resolvePurchaseOrderUploadUrl(), {
      method: 'POST',
      body,
      timeout: TMS_PURCHASE_ORDER_UPLOAD_TIMEOUT_MS,
    });
    const acceptedJob = normalizePurchaseOrderJobAccepted(response);
    setResponseStatus(event, 202);
    return acceptedJob;
  } catch (error) {
    forwardFetchError(error);
  }
});
