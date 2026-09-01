import { defineStore } from 'pinia';
import {
  TMS_PURCHASE_ORDER_JOB_NOTIFIED_KEY,
  TMS_PURCHASE_ORDER_JOB_STORAGE_KEY,
  TMS_PURCHASE_ORDER_POLL_INTERVAL_MS,
} from '~/constants/tms-portal-api';
import type {
  TmsPurchaseOrderJob,
  TmsPurchaseOrderJobStatus,
  TmsPurchaseOrderUploadFile,
} from '~/interfaces/portals/tms';

function readSessionValue(key: string): string | null {
  if (!import.meta.client) return null;
  return sessionStorage.getItem(key);
}

function writeSessionValue(key: string, value: string | null) {
  if (!import.meta.client) return;
  if (value) sessionStorage.setItem(key, value);
  else sessionStorage.removeItem(key);
}

export const useTmsPurchaseOrderJobStore = defineStore(
  'tmsPurchaseOrderJob',
  () => {
    const { uploadPurchaseOrders, fetchPurchaseOrderJob } =
      useTmsPurchaseOrderUpload();
    const toast = useToast();

    const jobId = ref<string | null>(readSessionValue(TMS_PURCHASE_ORDER_JOB_STORAGE_KEY));
    const status = ref<TmsPurchaseOrderJobStatus | 'idle' | 'expired'>('idle');
    const total = ref(0);
    const completed = ref(0);
    const files = ref<TmsPurchaseOrderUploadFile[]>([]);
    const submitting = ref(false);
    const expired = ref(false);
    const errorMessage = ref<string | null>(null);
    const notifiedJobId = ref<string | null>(
      readSessionValue(TMS_PURCHASE_ORDER_JOB_NOTIFIED_KEY),
    );

    let pollGeneration = 0;
    let polling = false;

    const isActive = computed(
      () =>
        submitting.value
        || status.value === 'pending'
        || status.value === 'processing',
    );
    const hasJob = computed(() => jobId.value != null);
    const progressLabel = computed(() => `${completed.value} / ${total.value}`);

    function persistJob(nextJobId: string | null) {
      jobId.value = nextJobId;
      writeSessionValue(TMS_PURCHASE_ORDER_JOB_STORAGE_KEY, nextJobId);
    }

    function markNotified(nextJobId: string) {
      notifiedJobId.value = nextJobId;
      writeSessionValue(TMS_PURCHASE_ORDER_JOB_NOTIFIED_KEY, nextJobId);
    }

    function applySnapshot(job: TmsPurchaseOrderJob) {
      persistJob(job.jobId);
      status.value = job.status;
      total.value = job.total;
      completed.value = job.completed;
      files.value = mergePurchaseOrderJobFiles(files.value, job.files);
      expired.value = false;
    }

    function notifyIfDone(job: TmsPurchaseOrderJob) {
      if (job.status !== 'done') return;
      if (notifiedJobId.value === job.jobId) return;
      markNotified(job.jobId);
      const feedback = formatPurchaseOrderJobDoneToast(
        summarizePurchaseOrderJobFiles(files.value),
      );
      toast.add({
        title: feedback.title,
        color: feedback.color,
        duration: 8000,
      });
    }

    function stopPolling() {
      pollGeneration += 1;
      polling = false;
    }

    async function pollLoop(generation: number) {
      if (polling && generation !== pollGeneration) return;
      polling = true;

      const result = await runPurchaseOrderJobPoll({
        fetchJob: async () => {
          if (!jobId.value) {
            throw createError({
              statusCode: 404,
              message: 'El trabajo de carga expiró o ya no existe.',
            });
          }
          return fetchPurchaseOrderJob(jobId.value);
        },
        intervalMs: TMS_PURCHASE_ORDER_POLL_INTERVAL_MS,
        isNotFound: isPurchaseOrderJobNotFound,
        shouldContinue: () => generation === pollGeneration,
        onSnapshot: (job) => {
          if (generation !== pollGeneration) return;
          applySnapshot(job);
          notifyIfDone(job);
        },
      });

      if (generation !== pollGeneration) return;

      if (result.outcome === 'not_found') {
        expired.value = true;
        status.value = 'expired';
        if (jobId.value && notifiedJobId.value !== jobId.value) {
          markNotified(jobId.value);
          toast.add({
            title: 'El trabajo de carga expiró',
            description:
              'El job ya no existe (TTL ~30 min o reinicio del servicio de PDFs). Vuelve a subir los archivos.',
            color: 'error',
            duration: 8000,
          });
        }
      }

      polling = false;
    }

    function startPolling() {
      if (!jobId.value || !import.meta.client) return;
      if (status.value === 'done' || status.value === 'expired') return;
      stopPolling();
      void pollLoop(pollGeneration);
    }

    async function startUpload(nextFiles: File[]) {
      if (submitting.value) return;

      submitting.value = true;
      errorMessage.value = null;
      expired.value = false;
      stopPolling();
      persistJob(null);
      writeSessionValue(TMS_PURCHASE_ORDER_JOB_NOTIFIED_KEY, null);
      notifiedJobId.value = null;
      status.value = 'pending';
      completed.value = 0;
      total.value = nextFiles.length;
      files.value = [];

      try {
        const accepted = await uploadPurchaseOrders(nextFiles);
        persistJob(accepted.jobId);
        total.value = accepted.total;
        status.value = 'pending';
        startPolling();
      } catch (error) {
        status.value = 'idle';
        persistJob(null);
        errorMessage.value = getFetchErrorMessage(error);
        toast.add({
          title: 'No se pudieron procesar las órdenes',
          description: errorMessage.value,
          color: 'error',
          duration: 8000,
        });
        throw error;
      } finally {
        submitting.value = false;
      }
    }

    if (import.meta.client && jobId.value && status.value === 'idle') {
      status.value = 'pending';
      startPolling();
    }

    return {
      jobId,
      status,
      total,
      completed,
      files,
      submitting,
      expired,
      errorMessage,
      isActive,
      hasJob,
      progressLabel,
      startUpload,
      startPolling,
      stopPolling,
    };
  },
);
