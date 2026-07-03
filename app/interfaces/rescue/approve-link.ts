/**
 * Item de POST /api/rescue/approve_link/<id>/generate/ (el backend devuelve un arreglo).
 */
export interface RescueApproveLinkGenerateItem {
  api_key: string;
  numero_telefonico?: string;
  user?: string;
}

export type RescueApproveLinkGenerateResponse = RescueApproveLinkGenerateItem[];

export interface RescueGuestApproveResponse {
  message?: string;
  detail?: string;
}
