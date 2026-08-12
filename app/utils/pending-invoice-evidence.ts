import type { RescueEvidenceType } from '~/interfaces/rescue/evidence';
import {
  RESCUE_EVIDENCE_LIST_PATH,
  RESCUE_EVIDENCE_MODAL_COPY,
  RESCUE_EVIDENCE_TYPE_PAYMENT_PROVIDER,
  RESCUE_EVIDENCE_TYPE_SERVICE,
  RESCUE_EVIDENCE_ZIP_WEBHOOK_DEFAULT,
  rescueEvidenceZipComplement,
} from '~/constants/rescue-evidence-api';
import {
  buildRescueEvidenceZipFilename,
  buildRescueEvidenceZipPayload,
  requestRescueEvidenceZipDownload,
} from '~/utils/rescue-evidence-upload';
import { mapRescueEvidenceListFromApi } from '~/utils/rescue-evidence-map';

export type PendingInvoiceEvidenceColumn =
  | 'evidencia_rescate'
  | 'evidencia_pagos';

export function pendingInvoiceEvidenceType(
  column: PendingInvoiceEvidenceColumn,
): RescueEvidenceType {
  return column === 'evidencia_pagos'
    ? RESCUE_EVIDENCE_TYPE_PAYMENT_PROVIDER
    : RESCUE_EVIDENCE_TYPE_SERVICE;
}

export function pendingInvoiceEvidenceZipFilename(
  folio: string,
  column: PendingInvoiceEvidenceColumn,
): string {
  return buildRescueEvidenceZipFilename({
    folio,
    complement: rescueEvidenceZipComplement(pendingInvoiceEvidenceType(column)),
  });
}

type ApiFetch = (
  url: string,
  options?: Record<string, unknown>,
) => Promise<unknown>;

export async function downloadPendingInvoiceEvidenceZip(input: {
  apiFetch: ApiFetch;
  rescueId: number;
  folio: string;
  column: PendingInvoiceEvidenceColumn;
  webhookUrl?: string;
}): Promise<string> {
  const type = pendingInvoiceEvidenceType(input.column);
  const raw = await input.apiFetch(RESCUE_EVIDENCE_LIST_PATH(input.rescueId));
  const urls = mapRescueEvidenceListFromApi(raw)
    .filter(item => item.type === type)
    .map(item => item.url);

  if (urls.length === 0) {
    throw new Error('No hay archivos para descargar');
  }

  const body = buildRescueEvidenceZipPayload({
    rescueId: input.rescueId,
    folio: input.folio,
    type,
    urls,
  });

  await requestRescueEvidenceZipDownload(
    body,
    input.webhookUrl || RESCUE_EVIDENCE_ZIP_WEBHOOK_DEFAULT,
  );

  return buildRescueEvidenceZipFilename(body);
}

export const PENDING_INVOICE_EVIDENCE_ZIP_ERROR =
  RESCUE_EVIDENCE_MODAL_COPY.downloadZipError;
