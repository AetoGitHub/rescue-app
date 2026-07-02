export interface AlegraItem {
  id?: number | string;
  name?: string | null;
  reference?: string | null;
  description?: string | null;
}

export interface AlegraItemDisplay {
  id: number;
  name: string;
  reference: string | null;
}
