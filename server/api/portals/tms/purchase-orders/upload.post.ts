import { accessAdministrative } from '#shared/abilities';
import { forwardFetchError } from '../../../../utils/forward-fetch-error';
import {
  extractPurchaseOrderPartialResponse,
  normalizePurchaseOrderUploadResponse,
  parsePurchaseOrderPdfParts,
  purchaseOrderPartsToFormData,
  rejectedFilesToUploadResults,
  resolvePurchaseOrderUploadUrl,
} from '../../../../utils/purchase-order-upload';

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  await authorize(event, accessAdministrative);

  const { accepted, rejected } = parsePurchaseOrderPdfParts(
    await readMultipartFormData(event),
  );
  const body = purchaseOrderPartsToFormData(accepted);
  const sentFileNames = accepted.map((part) => part.filename ?? '');
  const rejectedResults = rejectedFilesToUploadResults(rejected);

  try {
    const response = await $fetch(resolvePurchaseOrderUploadUrl(), {
      method: 'POST',
      body,
    });
    const normalized = normalizePurchaseOrderUploadResponse(response, {
      sentFileNames,
    });

    setResponseStatus(event, rejectedResults.length > 0 ? 207 : 201);
    return { files: [...normalized.files, ...rejectedResults] };
  } catch (error) {
    const partial = extractPurchaseOrderPartialResponse(error, { sentFileNames });
    if (partial) {
      setResponseStatus(event, 207);
      return {
        files: [...partial.files, ...rejectedResults],
        batchError: partial.batchError,
      };
    }
    forwardFetchError(error);
  }
});
