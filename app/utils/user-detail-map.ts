import { USER_ROLE_OPTIONS } from '~/constants/user-select-options';
import type { UserRole } from '~/interfaces/auth/user';
import { formatMexicoPhoneInput } from '~/utils/catalog-form';

const USER_ROLE_VALUES = new Set<UserRole>(
  USER_ROLE_OPTIONS.map((o) => o.value),
);

export interface UserFormState {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  phone: string;
  password: string;
  is_active: boolean;
}

export function mapUserDetail(raw: Record<string, unknown>): UserFormState {
  const roleRaw = String(raw.role ?? 'seller');
  const role: UserRole = USER_ROLE_VALUES.has(roleRaw as UserRole)
    ? (roleRaw as UserRole)
    : 'seller';

  return {
    username: String(raw.username ?? ''),
    first_name: String(raw.first_name ?? ''),
    last_name: String(raw.last_name ?? ''),
    email: String(raw.email ?? ''),
    role,
    phone: formatMexicoPhoneInput(String(raw.phone ?? '')),
    password: '',
    is_active: Boolean(raw.is_active ?? true),
  };
}
