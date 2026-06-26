import type { OperativeCommissionOperator } from '~/interfaces/auth/operative-commission';

export function mapOperativeCommissionRow(
  raw: Record<string, unknown>,
): OperativeCommissionOperator {
  const commissionRaw = raw.commission;
  const commission =
    commissionRaw == null || String(commissionRaw).trim() === ''
      ? null
      : String(commissionRaw);

  return {
    id: Number(raw.id),
    username: String(raw.username ?? ''),
    first_name: String(raw.first_name ?? ''),
    last_name: String(raw.last_name ?? ''),
    commission,
  };
}

export function operativeCommissionDisplayName(
  row: OperativeCommissionOperator,
): string {
  const fullName = `${row.first_name} ${row.last_name}`.trim();
  return fullName || row.username;
}

export function hasOperativeCommissionOverride(
  commission: string | null | undefined,
): boolean {
  return commission != null && commission.trim() !== '';
}

export function formatOperativeCommissionForApi(value: string): string {
  const trimmed = value.trim();
  if (trimmed === '') return '';
  const parsed = Number(trimmed.replace(/,/g, ''));
  if (!Number.isFinite(parsed)) return '';
  return parsed.toFixed(2);
}

export function operativeCommissionBadgeLabel(
  commission: string | null | undefined,
): string {
  if (!hasOperativeCommissionOverride(commission)) {
    return 'Usa default global';
  }
  const parsed = Number(String(commission).replace(/,/g, ''));
  const display = Number.isFinite(parsed) ? parsed.toFixed(0) : commission;
  return `Personalizado: ${display}%`;
}
