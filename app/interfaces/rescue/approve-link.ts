/**
 * Item de POST /api/rescue/approve_link/<id>/generate/ (el backend devuelve un arreglo).
 */
export interface RescueApproveLinkGenerateItem {
  api_key: string;
  user: string;
  numero_telefonico: string;
}

export type RescueApproveLinkGenerateResponse = RescueApproveLinkGenerateItem[];

/** Link listo para mostrar/copiar tras generate. */
export interface RescueApproveLinkGenerated {
  user: string;
  numero_telefonico: string;
  url: string;
}

export interface RescueGuestApproveResponse {
  message?: string;
  detail?: string;
}
