import type { RescueDropdownRow } from '~/interfaces/rescue/dropdown';
import { formatRescueDropdownLabel } from '~/schemas/rescue-admin-doc';

export function mapRescueDropdownRow(
  raw: Record<string, unknown>,
): RescueDropdownRow {
  return {
    id: Number(raw.id),
    folio: String(raw.folio ?? ''),
    client_name: String(raw.client_name ?? ''),
    admin_status: String(raw.admin_status ?? ''),
    operative_status: String(raw.operative_status ?? ''),
  };
}

export function mapRescueDropdownSelectItem(row: RescueDropdownRow) {
  return {
    id: row.id,
    label: formatRescueDropdownLabel(row),
    folio: row.folio,
    client_name: row.client_name,
  };
}
