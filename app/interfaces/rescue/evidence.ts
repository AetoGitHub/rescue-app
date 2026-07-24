export type RescueEvidenceType = 'service' | 'payment_provider';

export interface RescueEvidence {
  id: number;
  type: RescueEvidenceType;
  url: string;
}

export interface RescueEvidenceItemInput {
  type: RescueEvidenceType;
  url: string;
}

export interface RescueEvidenceCreateBody {
  evidences: RescueEvidenceItemInput[];
}

export interface RescueEvidenceCreateResponse {
  created: number;
}

/** Body for the n8n zip-download webhook (`zip-rescates`). */
export interface RescueEvidenceZipDownloadBody {
  rescue_id: number;
  folio: string;
  complement: string;
  urls: string[];
}
