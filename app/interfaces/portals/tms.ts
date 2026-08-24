import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';

export interface TmsRescue {
  id: number;
  folio: string;
  internal_notes: string;
  pdf_alegra: string | null;
  xml_alegra: string | null;
  remittance_folio: string | null;
  invoice_folio: string | null;
  oc_pdf: string | null;
  ready: boolean;
  /** Si es true, el portal no permite editar la fila. */
  correct_upload: boolean;
}

/** `null`/`undefined` = sin filtrar; el param solo se envía cuando es booleano. */
export type TmsTriState = boolean | null | undefined;

export interface TmsRescueFilters {
  ready?: TmsTriState;
  confirm?: TmsTriState;
  oc_pdf?: TmsTriState;
}

export type TmsRescueListResponse =
  | TmsRescue[]
  | PaginatedResponse<TmsRescue>;

export interface TmsRescueUpdateBody {
  id: number;
  oc_pdf: string | null;
  internal_notes: string;
  ready?: boolean;
}

export interface TmsPurchaseOrderUploadFile {
  fileName: string;
  orderNumber: string | null;
  url: string | null;
  extracted: boolean;
  message?: string;
  error?: string;
}

export interface TmsPurchaseOrderUploadResponse {
  files: TmsPurchaseOrderUploadFile[];
  /** Mensaje del servicio cuando el lote falló pero hay resultados por archivo. */
  batchError?: string | null;
}

export type TmsRowSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface TmsPurchaseOrderAssignment {
  file: TmsPurchaseOrderUploadFile;
  rescueId: number | null;
  status: 'assigned' | 'blocked' | 'unmatched' | 'ambiguous' | 'failed';
}
