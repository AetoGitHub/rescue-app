import { OPERATIONAL_KANBAN_COLUMNS } from '~/constants/operational-kanban';
import {
  RESCUE_ADMIN_STATUS_LABELS,
  RESCUE_DETAIL_PLACEHOLDER_NO_DESCRIPTION,
  RESCUE_DETAIL_PLACEHOLDER_NO_NOTES,
  RESCUE_DETAIL_PLACEHOLDER_UNDEFINED,
  RESCUE_DETAIL_PLACEHOLDER_UNASSIGNED,
} from '~/constants/operational-rescue-detail';
import type { OperationalRescueStatus } from '~/constants/operational-kanban';

export function getOperationalStatusLabel(
  status: OperationalRescueStatus | string,
): string {
  return (
    OPERATIONAL_KANBAN_COLUMNS.find((column) => column.status === status)
      ?.title ?? status
  );
}

export function getAdminStatusBadge(adminStatus: string | null | undefined): {
  label: string;
  color: 'error' | 'warning' | 'info' | 'neutral';
} {
  if (!adminStatus) {
    return { label: 'Sin atender', color: 'neutral' };
  }

  return (
    RESCUE_ADMIN_STATUS_LABELS[adminStatus] ?? {
      label: adminStatus.replaceAll('_', ' '),
      color: 'neutral',
    }
  );
}

export function getClientInitials(name: string | null | undefined): string {
  if (!name?.trim()) return '—';

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();

  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

export function formatDetailOptionalText(
  value: string | null | undefined,
  placeholder = RESCUE_DETAIL_PLACEHOLDER_UNDEFINED,
): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : placeholder;
}

export function formatDetailPersonName(
  value: string | null | undefined,
): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : RESCUE_DETAIL_PLACEHOLDER_UNASSIGNED;
}

export function formatDetailDescription(
  value: string | null | undefined,
): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : RESCUE_DETAIL_PLACEHOLDER_NO_DESCRIPTION;
}

export function formatDetailNotes(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : RESCUE_DETAIL_PLACEHOLDER_NO_NOTES;
}

export function parseRescueCoordinates(
  latitude: string | number | null | undefined,
  longitude: string | number | null | undefined,
): { lat: number; lng: number } | null {
  const lat = Number(String(latitude ?? '').trim());
  const lng = Number(String(longitude ?? '').trim());

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
}

export function formatChatMessageTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function showSalePriceFromQuote(
  salePrice: string | null | undefined,
  subTotal: string | null | undefined,
): boolean {
  const sale = parseRescueCardMoney(salePrice);
  const sub = parseRescueCardMoney(subTotal);
  return sale === 0 && sub > 0;
}

export function getRescueDetailFooterFlowLabel(
  operativeStatus: OperationalRescueStatus | string,
): string {
  switch (operativeStatus) {
    case 'active_without_quote':
      return 'Activo sin cotizar > Enviar a Autorización';
    case 'pending_authorization':
      return 'Pendiente de autorizar > Aprobado';
    case 'requested':
      return 'Solicitado > Activo sin cotizar';
    default:
      return `${getOperationalStatusLabel(operativeStatus)} > Siguiente paso`;
  }
}

export function getRescueDetailPrimaryActionLabel(
  operativeStatus: OperationalRescueStatus | string,
): string {
  switch (operativeStatus) {
    case 'active_without_quote':
      return 'Enviar a Autorización';
    case 'pending_authorization':
      return 'Autorizar';
    case 'requested':
      return 'Tomar solicitud';
    default:
      return 'Continuar';
  }
}
