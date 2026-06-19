declare module '#auth-utils' {
  interface User {
    id: number;
    name: string;
    role: string;
  }

  interface UserSession {
    token?: string;
  }
}

export interface AuthRefreshResponse {
  token: string;
  id: number;
  role: string;
  name: string;
}

export {};
