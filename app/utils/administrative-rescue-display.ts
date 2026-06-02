import {
  ADMINISTRATIVE_KANBAN_COLUMNS,
  type AdministrativeBillingStatus,
} from '~/constants/administrative-kanban';
import { OPERATIONAL_KANBAN_COLUMNS } from '~/constants/operational-kanban';
import type { OperationalRescueStatus } from '~/constants/operational-kanban';

export function getBillingStatusLabel(
  status: AdministrativeBillingStatus | string,
): string {
  return (
    ADMINISTRATIVE_KANBAN_COLUMNS.find((column) => column.status === status)
      ?.title ?? String(status).replaceAll('_', ' ')
  );
}

export function getBillingStatusBadge(
  status: AdministrativeBillingStatus | string | null | undefined,
): {
  label: string;
  color: 'neutral' | 'info' | 'warning' | 'success' | 'error' | 'primary';
} {
  if (!status) {
    return { label: 'Sin atender', color: 'neutral' };
  }

  const colors: Record<
    AdministrativeBillingStatus,
    'neutral' | 'info' | 'warning' | 'success' | 'error' | 'primary'
  > = {
    invalid: 'neutral',
    unattended: 'neutral',
    in_remittance: 'info',
    invoiced: 'primary',
    paid: 'success',
    warranty: 'warning',
    canceled: 'error',
  };

  return {
    label: getBillingStatusLabel(status),
    color: colors[status as AdministrativeBillingStatus] ?? 'neutral',
  };
}

export function getAdministrativeOperativeStatusLabel(
  status: OperationalRescueStatus | string,
): string {
  return (
    OPERATIONAL_KANBAN_COLUMNS.find((column) => column.status === status)
      ?.title ?? String(status)
  );
}
