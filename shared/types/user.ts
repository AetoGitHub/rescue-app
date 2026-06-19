export type AuthUserRole = 'admin' | 'operator' | 'seller' | 'client';

export type AuthUser = {
  id: number;
  name: string;
  role: AuthUserRole | string;
};
