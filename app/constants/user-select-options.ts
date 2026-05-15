import type { UserRole } from '~/interfaces/auth/user';

export const USER_ROLE_OPTIONS: { label: string; value: UserRole }[] = [
  { label: 'Administrador', value: 'admin' },
  { label: 'Operador', value: 'operator' },
  { label: 'Vendedor', value: 'seller' },
  { label: 'Cliente', value: 'client' },
];
