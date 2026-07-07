export type PendingInvoiceStatusFilter = 'unattended' | 'in_remittance';

export type PendingInvoiceAttentionFilter = 'needs_attention';

export interface PendingInvoiceDetailFilters {
  search: string;
  companyId: number | null;
  sellerId: number | null;
  operatorId: number | null;
  month: number | null;
  year: number | null;
  status: PendingInvoiceStatusFilter | null;
  attention: PendingInvoiceAttentionFilter | null;
}
