export interface FillOcPendingItem {
  id: number;
  folio: string;
  responsable: string;
  vehicle: string;
  service_description: string;
  unattended_at: string;
  sub_total: string | number;
  iva: string | number;
  total: string | number;
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

export interface FillOcStaffToken {
  token: string;
  userId: number | null;
}
