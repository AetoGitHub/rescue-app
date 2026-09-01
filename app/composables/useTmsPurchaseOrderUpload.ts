import {
  TMS_PURCHASE_ORDER_POLL_INTERVAL_MS,
  TMS_PURCHASE_ORDER_UPLOAD_PATH,
  tmsPurchaseOrderJobPath,
} from '~/constants/tms-portal-api';
import type {
  TmsPurchaseOrderJob,
  TmsPurchaseOrderJobAccepted,
} from '~/interfaces/portals/tms';

export function useTmsPurchaseOrderUpload() {
  const apiFetch = useApiFetch();

  function uploadPurchaseOrders(files: File[]) {
    const body = new FormData();
    for (const file of files) body.append('files', file);

    return apiFetch<TmsPurchaseOrderJobAccepted>(
      TMS_PURCHASE_ORDER_UPLOAD_PATH,
      { method: 'POST', body },
    );
  }

  function fetchPurchaseOrderJob(jobId: string) {
    return apiFetch<TmsPurchaseOrderJob>(tmsPurchaseOrderJobPath(jobId));
  }

  async function uploadPurchaseOrdersAndWait(
    files: File[],
    options?: { shouldContinue?: () => boolean },
  ): Promise<TmsPurchaseOrderJob> {
    const accepted = await uploadPurchaseOrders(files);
    let latest: TmsPurchaseOrderJob | null = null;

    const result = await runPurchaseOrderJobPoll({
      fetchJob: () => fetchPurchaseOrderJob(accepted.jobId),
      intervalMs: TMS_PURCHASE_ORDER_POLL_INTERVAL_MS,
      isNotFound: isPurchaseOrderJobNotFound,
      shouldContinue: options?.shouldContinue,
      onSnapshot: (job) => {
        latest = job;
      },
    });

    if (result.outcome === 'not_found') {
      throw createError({
        statusCode: 404,
        message: 'El trabajo de carga expiró o ya no existe.',
      });
    }

    const job = result.job ?? latest;
    if (!job) {
      throw createError({
        statusCode: 502,
        message: 'No se pudo consultar el trabajo de carga.',
      });
    }

    return job;
  }

  return {
    uploadPurchaseOrders,
    fetchPurchaseOrderJob,
    uploadPurchaseOrdersAndWait,
  };
}
