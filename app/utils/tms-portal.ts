import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import type {
  TmsPurchaseOrderAssignment,
  TmsPurchaseOrderUploadFile,
  TmsRescue,
  TmsRescueListResponse,
} from '~/interfaces/portals/tms';

export function normalizeTmsRescuePage(
  response: TmsRescueListResponse,
): PaginatedResponse<TmsRescue> {
  if (Array.isArray(response)) {
    return {
      next: null,
      previous: null,
      results: response,
    };
  }

  return response;
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
      (rescue) => comparableFolio(rescue.remittance_folio) === orderNumber,
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
