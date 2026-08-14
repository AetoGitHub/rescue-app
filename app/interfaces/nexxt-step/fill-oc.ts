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
