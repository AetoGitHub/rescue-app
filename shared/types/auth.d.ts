declare module '#auth-utils' {
  interface User {
    id: number;
    name: string;
    role: string;
    is_superuser?: boolean;
  }

  interface UserSession {
    token?: string;
    tokenRefreshedAt?: number;
  }
}

export interface AuthRefreshResponse {
  token: string;
  id: number;
  role: string;
  name: string;
  is_superuser?: boolean;
}

export {};
