import { RESCUE_SERVICE_TYPE_OPTIONS } from '~/constants/rescue-select-options';

const moneyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const SERVICE_TYPE_BADGE_COLORS: Record<string, string> = {
  rescue: 'info',
  loan: 'primary',
  direct_budget: 'secondary',
  proyect: 'warning',
};

export function parseRescueCardMoney(value: string | number | null | undefined): number {
  if (value == null) return 0;
  const parsed = Number(String(value).trim().replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatRescueCardMoney(value: string | number | null | undefined): string {
  return moneyFormatter.format(parseRescueCardMoney(value));
}

export function formatElapsedDuration(totalMinutes: number): string {
  const minutes = Math.max(0, Math.floor(totalMinutes));
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (remainingHours === 0) return `${days}d`;
  return `${days}d ${remainingHours}h`;
}

export function formatElapsedSince(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';

  const createdAt = new Date(isoDate);
  if (Number.isNaN(createdAt.getTime())) return '—';

  const elapsedMinutes = Math.floor((Date.now() - createdAt.getTime()) / 60_000);
  return formatElapsedDuration(elapsedMinutes);
}

export function getRescueServiceTypeBadge(serviceType: string | null | undefined): {
  label: string;
  icon: string;
  color: string;
} {
  const normalized = serviceType?.trim();
  if (!normalized) {
    return {
      label: 'SIN TIPO',
      icon: 'i-lucide-file-text',
      color: 'neutral',
    };
  }

  const match = RESCUE_SERVICE_TYPE_OPTIONS.find(
    (option) => option.value === normalized,
  );

  if (match) {
    return {
      label: match.label.toUpperCase(),
      icon: match.icon,
      color: SERVICE_TYPE_BADGE_COLORS[match.value] ?? 'neutral',
    };
  }

  return {
    label: normalized.replaceAll('_', ' ').toUpperCase(),
    icon: 'i-lucide-file-text',
    color: 'neutral',
  };
}

export function getGestorInitials(nombre: string | null | undefined): string {
  if (!nombre?.trim()) return '—';

  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();

  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

export function getGestorBadgeColor(adminStatus: string | null | undefined): string {
  switch (adminStatus) {
    case 'working':
      return 'info';
    case 'requires_human':
      return 'warning';
    case 'invalid':
      return 'error';
    default:
      return 'neutral';
  }
}

export function getRescueCardElapsedLabel(card: {
  operative_status: string;
  elapsed_minutes?: number;
  phase_started_at?: string | null;
}): string {
  if (
    card.operative_status === 'in_progress'
    && card.elapsed_minutes != null
  ) {
    return formatElapsedDuration(card.elapsed_minutes);
  }

  return formatElapsedSince(card.phase_started_at);
}

export function getRescueCardAdvanceAmount(card: {
  sub_total?: string | null;
}): string {
  return formatRescueCardMoney(card.sub_total);
}

export function hasRescueCardSupplier(supplierName: string | null | undefined): boolean {
  return Boolean(supplierName?.trim());
}

/** Número económico for cards; null when missing or blank. */
export function getRescueCardVehicleLabel(
  vehicle: string | null | undefined,
): string | null {
  const trimmed = vehicle?.trim();
  return trimmed ? trimmed : null;
}
