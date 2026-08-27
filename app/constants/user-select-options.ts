import type { UserRole } from '~/interfaces/auth/user';

/** Helper del campo comisión: el input es porcentaje humano; el API guarda fracción. */
export const USER_COMMISSION_FIELD_HELP =
  'Ejemplo: escribes 70 y se guarda 0.7.';

export const USER_ROLE_OPTIONS: { label: string; value: UserRole }[] = [
  { label: 'Administrador', value: 'admin' },
  { label: 'Operador', value: 'operator' },
  { label: 'Vendedor', value: 'seller' },
  { label: 'Cliente', value: 'client' },
];
