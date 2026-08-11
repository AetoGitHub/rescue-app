export interface AlegraContact {
  id?: number | string;
  name?: string | null;
  email?: string | null;
  identification?: string | null;
}

/** Página de contactos devuelta por Alegra (`results` + offset en `next`/`previous`). */
export interface AlegraContactsListPage {
  items: AlegraContact[];
  next: string | null;
  previous: string | null;
}
