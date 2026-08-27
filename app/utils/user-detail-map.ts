import { USER_ROLE_OPTIONS } from '~/constants/user-select-options';
import type { UserRole } from '~/interfaces/auth/user';
import {
  apiFractionToPercentString,
  formatMexicoPhoneInput,
} from '~/utils/catalog-form';

const USER_ROLE_VALUES = new Set<UserRole>(
  USER_ROLE_OPTIONS.map((o) => o.value),
);

/** Username en UI y API: mayúsculas, sin espacios. */
export function formatUsernameInput(value: string | number | undefined): string {
  return String(value ?? '')
    .replace(/\s/g, '')
    .toUpperCase();
}

export interface UserFormState {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  phone: string;
  commission: string;
  password: string;
  is_active: boolean;
}

export function mapUserDetail(raw: Record<string, unknown>): UserFormState {
  const roleRaw = String(raw.role ?? 'seller');
  const role: UserRole = USER_ROLE_VALUES.has(roleRaw as UserRole)
    ? (roleRaw as UserRole)
    : 'seller';

  return {
    username: formatUsernameInput(String(raw.username ?? '')),
    first_name: String(raw.first_name ?? ''),
    last_name: String(raw.last_name ?? ''),
    email: String(raw.email ?? ''),
    role,
    phone: formatMexicoPhoneInput(String(raw.phone ?? '')),
    commission: apiFractionToPercentString(String(raw.commission ?? '0.00')),
    password: '',
    is_active: Boolean(raw.is_active ?? true),
  };
}

/** Lista de usuarios: `0.7` → `70%`. Si el API manda `70`, también muestra `70%`. */
export function formatUserCommissionPercent(
  value: string | null | undefined,
): string {
  if (value == null || String(value).trim() === '') return '—';
  const human = Number(apiFractionToPercentString(String(value)));
  if (!Number.isFinite(human)) return '—';
  if (human === 0) return '0%';
  return `${human % 1 === 0 ? human.toFixed(0) : human.toFixed(2).replace(/\.?0+$/, '')}%`;
}
