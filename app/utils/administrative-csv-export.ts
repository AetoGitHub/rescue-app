import type { AdministrativeRescueCard } from '~/interfaces/rescue/administrative';
import {
  getAdministrativeOperativeStatusLabel,
  getBillingStatusLabel,
} from '~/utils/administrative-rescue-display';
import { formatRescueCardMoney } from '~/utils/operational-rescue-card';
import { getRescueServiceTypeBadge } from '~/utils/operational-rescue-card';

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

export function buildAdministrativeCsv(cards: AdministrativeRescueCard[]): string {
  const headers = [
    'Folio',
    'Tipo',
    'Cliente',
    'Gestor',
    'Precio venta',
    'Utilidad',
    'Estatus operativo',
    'Estatus administrativo',
    'Fecha creación',
    'Fecha servicio',
  ];

  const rows = cards.map((card) => {
    const typeBadge = getRescueServiceTypeBadge(card.service_type);
    return [
      card.folio,
      typeBadge.label,
      card.client_name,
      card.operator_name?.trim() || '—',
      formatRescueCardMoney(card.sale_price),
      formatRescueCardMoney(card.net_profit),
      getAdministrativeOperativeStatusLabel(card.operative_status),
      getBillingStatusLabel(card.billing_status),
      card.created_at,
      card.service_date ?? '—',
    ];
  });

  const allRows = [headers, ...rows];

  return allRows
    .map((row) => row.map((cell) => escapeCsvCell(String(cell))).join(','))
    .join('\n');
}

export function downloadAdministrativeCsv(
  cards: AdministrativeRescueCard[],
  filename = 'rescates-administrativos.csv',
): void {
  const content = buildAdministrativeCsv(cards);
  const blob = new Blob([`\uFEFF${content}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
