import type { CatalogDropdownSelection } from '~/interfaces/shared/catalog-dropdown.interface';

export type PendingInvoiceStatusFilter = 'unattended' | 'in_remittance';

export type PendingInvoiceAttentionFilter = 'needs_attention';

export interface PendingInvoiceDetailFilters {
  search: string;
  company: CatalogDropdownSelection;
  seller: CatalogDropdownSelection;
  operator: CatalogDropdownSelection;
  month: number | null;
  year: number | null;
  status: PendingInvoiceStatusFilter | null;
  attention: PendingInvoiceAttentionFilter | null;
}
