import {
  TMS_PURCHASE_ORDER_MAX_FILE_BYTES,
  TMS_PURCHASE_ORDER_MAX_FILES,
} from '~/constants/tms-portal-api';
import type {
  TmsPurchaseOrderJob,
  TmsPurchaseOrderJobStatus,
  TmsPurchaseOrderUploadFile,
} from '~/interfaces/portals/tms';
import { getFetchStatusCode } from '~/utils/fetch-error-message';

export interface PurchaseOrderFileLike {
  name: string;
  type?: string;
  size: number;
}

export interface PurchaseOrderJobFileSummary {
  extracted: number;
  withoutFolio: number;
  errors: number;
  total: number;
}

export function isPurchaseOrderPdfFile(
  file: Pick<PurchaseOrderFileLike, 'name' | 'type'>,
): boolean {
  return (
    file.type === 'application/pdf'
    || file.name.toLowerCase().endsWith('.pdf')
  );
}

export function isPurchaseOrderFileWithinSize(
  file: Pick<PurchaseOrderFileLike, 'size'>,
): boolean {
  return file.size > 0 && file.size <= TMS_PURCHASE_ORDER_MAX_FILE_BYTES;
}

export function getPurchaseOrderFileListError(
  files: PurchaseOrderFileLike[],
): string | null {
  if (files.length === 0) return 'Selecciona al menos un archivo PDF';
  if (files.length > TMS_PURCHASE_ORDER_MAX_FILES) {
    return `Puedes subir hasta ${TMS_PURCHASE_ORDER_MAX_FILES} archivos PDF`;
  }
  if (files.some((file) => !isPurchaseOrderPdfFile(file))) {
    return 'Selecciona únicamente archivos PDF';
  }
  if (files.some((file) => file.size > TMS_PURCHASE_ORDER_MAX_FILE_BYTES)) {
    return 'Cada PDF debe pesar 10 MB o menos';
  }
  if (files.some((file) => file.size === 0)) {
    return 'El archivo está vacío';
  }
  return null;
}

export function mergePurchaseOrderJobFiles(
  existing: TmsPurchaseOrderUploadFile[],
  incoming: TmsPurchaseOrderUploadFile[],
): TmsPurchaseOrderUploadFile[] {
  const byName = new Map(existing.map((file) => [file.fileName, file]));
  for (const file of incoming) {
    byName.set(file.fileName, file);
  }

  const merged: TmsPurchaseOrderUploadFile[] = [];
  const seen = new Set<string>();

  for (const file of existing) {
    const next = byName.get(file.fileName);
    if (!next || seen.has(file.fileName)) continue;
    merged.push(next);
    seen.add(file.fileName);
  }

  for (const file of incoming) {
    if (seen.has(file.fileName)) continue;
    merged.push(file);
    seen.add(file.fileName);
  }

  return merged;
}

export function summarizePurchaseOrderJobFiles(
  files: TmsPurchaseOrderUploadFile[],
): PurchaseOrderJobFileSummary {
  return files.reduce<PurchaseOrderJobFileSummary>(
    (summary, file) => {
      summary.total += 1;
      if (file.error) summary.errors += 1;
      else if (file.extracted) summary.extracted += 1;
      else summary.withoutFolio += 1;
      return summary;
    },
    { extracted: 0, withoutFolio: 0, errors: 0, total: 0 },
  );
}

export function formatPurchaseOrderJobDoneToast(
  summary: PurchaseOrderJobFileSummary,
): {
  title: string;
  description: string;
  color: 'success' | 'warning' | 'error';
} {
  const description = `${summary.extracted} con folio, ${summary.withoutFolio} sin folio, ${summary.errors} con error.`;

  if (summary.total > 0 && summary.errors === summary.total) {
    return {
      title: `Carga terminada: ${description}`,
      description: '',
      color: 'error',
    };
  }

  return {
    title: `Carga terminada: ${description}`,
    description: '',
    color:
      summary.errors > 0 || summary.withoutFolio > 0 ? 'warning' : 'success',
  };
}

export function shouldStopPurchaseOrderJobPoll(
  status: TmsPurchaseOrderJobStatus | null | undefined,
): boolean {
  return status === 'done';
}

export function isPurchaseOrderJobNotFound(error: unknown): boolean {
  return getFetchStatusCode(error) === 404;
}

export type PurchaseOrderJobPollOutcome = 'done' | 'not_found' | 'stopped';

export async function runPurchaseOrderJobPoll(options: {
  fetchJob: () => Promise<TmsPurchaseOrderJob>;
  intervalMs: number;
  isNotFound?: (error: unknown) => boolean;
  onSnapshot?: (job: TmsPurchaseOrderJob) => void;
  shouldContinue?: () => boolean;
  wait?: (ms: number) => Promise<void>;
}): Promise<{
  outcome: PurchaseOrderJobPollOutcome;
  job: TmsPurchaseOrderJob | null;
}> {
  const isNotFound = options.isNotFound ?? isPurchaseOrderJobNotFound;
  const wait =
    options.wait
    ?? ((ms: number) => new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    }));

  let job: TmsPurchaseOrderJob | null = null;

  while (options.shouldContinue?.() ?? true) {
    try {
      job = await options.fetchJob();
      options.onSnapshot?.(job);
      if (shouldStopPurchaseOrderJobPoll(job.status)) {
        return { outcome: 'done', job };
      }
    } catch (error) {
      if (isNotFound(error)) {
        return { outcome: 'not_found', job };
      }
    }

    if (!(options.shouldContinue?.() ?? true)) break;
    await wait(options.intervalMs);
  }

  return { outcome: 'stopped', job };
}
