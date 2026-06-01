/** Active: create quote for a rescue. */
export const RESCUE_QUOTE_CREATE_PATH = '/api/rescue/quote/create/';

export const RESCUE_QUOTE_DETAIL_PATH = (rescueId: number) =>
  `/api/rescue/quote/detail/${rescueId}/`;

export const RESCUE_QUOTE_UPDATE_PATH = (rescueId: number) =>
  `/api/rescue/quote/update/${rescueId}/`;
