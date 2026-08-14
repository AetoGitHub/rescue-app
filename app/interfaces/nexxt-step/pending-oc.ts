/** Contacto que n8n notifica; `GET /api/nexxt-step/pending-oc/`. */
export interface PendingOcContact {
  id: number;
  contact_name: string;
  whatsapp_number: string;
  url: string;
  /** Query param `key` extraído de `url` para `/admin/llenar-oc`. */
  key: string;
}

export interface PendingOcResponse {
  contacts: PendingOcContact[];
}
