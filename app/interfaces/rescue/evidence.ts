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
