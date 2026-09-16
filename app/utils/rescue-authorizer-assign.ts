import type { RescueCardDetail } from '~/interfaces/rescue/detail';

export function hasRescueAuthorizerAssigned(detail: RescueCardDetail): boolean {
  return detail.authorizer_id != null;
}
