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
}

export type TmsRescueListResponse =
  | TmsRescue[]
  | PaginatedResponse<TmsRescue>;

export interface TmsRescueUpdateBody {
  id: number;
  oc_pdf: string | null;
  internal_notes: string;
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
  status: 'assigned' | 'unmatched' | 'ambiguous' | 'failed';
}
