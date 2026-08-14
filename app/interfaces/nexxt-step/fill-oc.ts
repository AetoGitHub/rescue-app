export interface FillOcPendingItem {
  id: number;
  folio: string;
  total: string;
  unattended_at: string;
}

export interface FillOcSubmitBody {
  id: number;
  oc: string;
}

/** Resultado interno de la query: el 401 no se relanza para no disparar error.vue. */
export interface FillOcListResult {
  items: FillOcPendingItem[];
  errorStatus: number | null;
  errorMessage: string;
}
