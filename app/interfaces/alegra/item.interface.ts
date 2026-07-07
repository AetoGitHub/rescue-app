export interface AlegraItem {
  id?: number | string;
  name?: string | null;
  reference?: string | null;
  description?: string | null;
}

/** Página de ítems devuelta por Alegra (`results` + offset en `next`/`previous`). */
export interface AlegraItemsListPage {
  items: AlegraItem[];
  next: string | null;
  previous: string | null;
}

export interface AlegraItemDisplay {
  id: number;
  name: string;
  reference: string | null;
}
