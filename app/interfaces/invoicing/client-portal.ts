/** Fila de `GET /api/client/dropdown/`. */
export interface ClientPortalDropdownApiRow {
  id: number;
  name: string;
  company_id: number | null;
  company_name: string | null;
}

export interface ClientPortalClientOption {
  id: number;
  name: string;
  companyName: string | null;
}

export interface ClientPortalClientGroup {
  companyName: string;
  clients: ClientPortalClientOption[];
}
