import type { RescueQuoteLine } from '~/interfaces/rescue';

export type QuoteClassifierInputType = 'text' | 'image' | 'voice';

export interface QuoteClassifierRequestBody {
  input: string;
  type: QuoteClassifierInputType;
}

export interface QuoteClassifierLineRaw {
  service_id: number | null;
  service_label: string;
  quantity: number;
  unit_cost?: number;
}

export interface QuoteClassifierResponse {
  success?: boolean;
  quote_lines: QuoteClassifierLineRaw[];
  notes: string[];
}

export interface QuoteClassifierApplyPayload {
  lines: RescueQuoteLine[];
  notes: string[];
}
