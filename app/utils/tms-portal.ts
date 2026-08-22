import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import type {
  TmsPurchaseOrderAssignment,
  TmsPurchaseOrderUploadFile,
  TmsRescue,
  TmsRescueFilters,
  TmsRescueListResponse,
} from '~/interfaces/portals/tms';

function normalizeTmsRescue(rescue: TmsRescue): TmsRescue {
  return {
    ...rescue,
    ready: rescue.ready === true,
    correct_upload: rescue.correct_upload === true,
  };
}

export function isTmsRescueReadOnly(
  rescue: Pick<TmsRescue, 'correct_upload'>,
): boolean {
  return rescue.correct_upload === true;
}

/** Campos que el portal exige para considerar el rescate completo. */
const TMS_REQUIRED_FIELDS = [
  'pdf_alegra',
  'xml_alegra',
  'remittance_folio',
  'invoice_folio',
  'oc_pdf',
  'internal_notes',
] as const;

export function tmsRescueMissingFields(rescue: TmsRescue): string[] {
  return TMS_REQUIRED_FIELDS.filter((field) => !rescue[field]?.trim());
}

export function isTmsRescueComplete(rescue: TmsRescue): boolean {
  return tmsRescueMissingFields(rescue).length === 0;
}

export type TmsTriStateOption = 'all' | 'true' | 'false';

/** El select vive en la barra de filtros, así que el label va dentro de cada opción. */
export function tmsTriStateItems(
  label: string,
): { label: string; value: TmsTriStateOption }[] {
  return [
    { label: `${label}: todos`, value: 'all' },
    { label: `${label}: sí`, value: 'true' },
    { label: `${label}: no`, value: 'false' },
  ];
}

export function toTmsTriState(value: TmsTriStateOption): boolean | null {
  if (value === 'all') return null;
  return value === 'true';
}

export function buildTmsRescueQuery(
  filters: TmsRescueFilters | undefined,
): Record<string, string> {
  const query: Record<string, string> = {};
  if (typeof filters?.ready === 'boolean') query.ready = String(filters.ready);
  if (typeof filters?.confirm === 'boolean') {
    query.confirm = String(filters.confirm);
  }
  return query;
}

export function serializeTmsRescueFilters(
  filters: TmsRescueFilters | undefined,
): string[] {
  return [
    `ready:${filters?.ready ?? 'all'}`,
    `confirm:${filters?.confirm ?? 'all'}`,
  ];
}

export function normalizeTmsRescuePage(
  response: TmsRescueListResponse,
): PaginatedResponse<TmsRescue> {
  if (Array.isArray(response)) {
    return {
      next: null,
      previous: null,
      results: response.map(normalizeTmsRescue),
    };
  }

  return {
    ...response,
    results: response.results.map(normalizeTmsRescue),
  };
}

function comparableFolio(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

export function assignTmsPurchaseOrders(
  files: TmsPurchaseOrderUploadFile[],
  rescues: TmsRescue[],
): TmsPurchaseOrderAssignment[] {
  return files.map((file) => {
    if (!file.url) {
      return { file, rescueId: null, status: 'failed' };
    }

    const orderNumber = comparableFolio(file.orderNumber);
    if (!orderNumber) {
      return { file, rescueId: null, status: 'unmatched' };
    }

    const matches = rescues.filter(
      (rescue) =>
        comparableFolio(rescue.remittance_folio) === orderNumber
        && !isTmsRescueReadOnly(rescue),
    );

    if (matches.length === 1) {
      return { file, rescueId: matches[0]!.id, status: 'assigned' };
    }

    return {
      file,
      rescueId: null,
      status: matches.length > 1 ? 'ambiguous' : 'unmatched',
    };
  });
}

export interface TmsUploadSummary {
  total: number;
  assigned: number;
  pending: number;
  failed: number;
}

export function summarizeTmsAssignments(
  assignments: TmsPurchaseOrderAssignment[],
): TmsUploadSummary {
  return assignments.reduce<TmsUploadSummary>(
    (summary, assignment) => {
      summary.total += 1;
      if (assignment.status === 'assigned') summary.assigned += 1;
      else if (assignment.status === 'failed') summary.failed += 1;
      else summary.pending += 1;
      return summary;
    },
    { total: 0, assigned: 0, pending: 0, failed: 0 },
  );
}

export interface TmsAssignmentDescriptor {
  label: string;
  reason: string;
  icon: string;
  color: 'success' | 'warning' | 'error';
}

export function describeTmsAssignment(
  assignment: TmsPurchaseOrderAssignment,
): TmsAssignmentDescriptor {
  const { file, status } = assignment;
  const orderNumber = comparableFolio(file.orderNumber);

  if (status === 'failed') {
    return {
      label: 'Con error',
      reason:
        file.error
        ?? file.message
        ?? 'El servicio no pudo procesar este PDF, vuelve a intentarlo.',
      icon: 'i-lucide-circle-x',
      color: 'error',
    };
  }

  if (status === 'assigned') {
    return {
      label: 'Asignada',
      reason: orderNumber
        ? `Relacionada por la orden de compra ${orderNumber}.`
        : 'Relacionada manualmente.',
      icon: 'i-lucide-circle-check',
      color: 'success',
    };
  }

  if (status === 'ambiguous') {
    return {
      label: 'Varias coincidencias',
      reason: `La orden ${orderNumber} coincide con más de un rescate, elige el correcto.`,
      icon: 'i-lucide-copy',
      color: 'warning',
    };
  }

  return orderNumber
    ? {
        label: 'Sin coincidencia',
        reason: `La orden ${orderNumber} no coincide con ningún rescate del portal.`,
        icon: 'i-lucide-search-x',
        color: 'warning',
      }
    : {
        label: 'Orden no detectada',
        reason:
          file.error
          ?? file.message
          ?? 'No se pudo leer el número de orden en el PDF, asígnala manualmente.',
        icon: 'i-lucide-file-question',
        color: 'warning',
      };
}

export function formatTmsUploadFeedback(summary: TmsUploadSummary): {
  title: string;
  description: string;
  color: 'success' | 'warning' | 'error';
} {
  const parts = [
    `${summary.assigned} asignada${summary.assigned === 1 ? '' : 's'}`,
    `${summary.pending} por asignar`,
    `${summary.failed} con error`,
  ];

  if (summary.failed === summary.total && summary.total > 0) {
    return {
      title: 'Ningún PDF se pudo procesar',
      description: parts.join(' · '),
      color: 'error',
    };
  }

  return {
    title:
      summary.failed > 0
        ? `Lote procesado con ${summary.failed} error${summary.failed === 1 ? '' : 'es'}`
        : 'Lote procesado',
    description: `${summary.total} PDF${summary.total === 1 ? '' : 's'}: ${parts.join(' · ')}`,
    color: summary.failed > 0 || summary.assigned === 0 ? 'warning' : 'success',
  };
}

/** Archivos que conviene conservar en el input para reintentar la carga. */
export function retryableTmsUploadFiles(
  files: File[],
  assignments: TmsPurchaseOrderAssignment[],
): File[] {
  const failed = new Set(
    assignments
      .filter((assignment) => assignment.status === 'failed')
      .map((assignment) => assignment.file.fileName),
  );
  if (failed.size === 0) return [];

  return files.filter((file) => failed.has(file.name));
}

export function matchesTmsRescueSearch(
  rescue: TmsRescue,
  search: string,
): boolean {
  const normalized = search.trim().toLocaleLowerCase('es-MX');
  if (!normalized) return true;

  return [
    rescue.folio,
    rescue.internal_notes,
    rescue.remittance_folio,
    rescue.invoice_folio,
  ].some((value) => value?.toLocaleLowerCase('es-MX').includes(normalized));
}
