import type { ContractItem } from '~/interfaces/catalogs/contract';

export interface ContractItemEditableRow {
  id: number;
  service_id: number;
  service_name: string;
  category_name: string | null;
  price: string;
  price_multiplier: string;
  percentaje: string;
  notes: string;
  base_price: number | null;
}

export function parseContractPrice(value: string | number | null | undefined): number {
  if (value == null) return 0;
  const parsed = Number(String(value).trim().replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatContractMoney(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatContractPriceDifference(
  negotiated: string,
  basePrice: number | null,
): string {
  if (basePrice == null) return '—';
  const diff = parseContractPrice(negotiated) - basePrice;
  if (diff === 0) return formatContractMoney(0);
  const sign = diff > 0 ? '+' : '';
  return `${sign}${formatContractMoney(diff)}`;
}

export function contractItemToEditableRow(
  item: ContractItem,
  categoryName: string | null = null,
): ContractItemEditableRow {
  return {
    id: item.id,
    service_id: item.service_id,
    service_name: item.service_name,
    category_name: categoryName,
    price: item.price,
    price_multiplier: item.price_multiplier || '1',
    percentaje: item.percentaje || '0',
    notes: item.notes ?? '',
    base_price: null,
  };
}

export function editableRowToUpdateBody(row: ContractItemEditableRow) {
  return {
    service: row.service_id,
    price: row.price.trim(),
    price_multiplier: row.price_multiplier.trim() || '1',
    percentaje: row.percentaje.trim() || '0',
    notes: row.notes.trim(),
  };
}
