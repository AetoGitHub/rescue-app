export type UserRole = 'admin' | 'operator' | 'seller' | 'client';

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  phone: string;
  is_active: boolean;
}

export interface UserCreateBody {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  phone: string;
  password: string;
}

export interface UserUpdateBody {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  phone: string;
  is_active: boolean;
  password?: string;
}
