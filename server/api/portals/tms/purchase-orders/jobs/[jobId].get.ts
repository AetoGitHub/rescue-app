import { accessAdministrative } from '#shared/abilities';
import { forwardFetchError } from '../../../../../utils/forward-fetch-error';
import {
  assertPurchaseOrderJobId,
  normalizePurchaseOrderJob,
  resolvePurchaseOrderJobUrl,
} from '../../../../../utils/purchase-order-upload';

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  await authorize(event, accessAdministrative);

  const jobId = assertPurchaseOrderJobId(getRouterParam(event, 'jobId'));

  try {
    const response = await $fetch(resolvePurchaseOrderJobUrl(jobId));
    return normalizePurchaseOrderJob(response);
  } catch (error) {
    forwardFetchError(error);
  }
});
