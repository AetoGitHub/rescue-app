import type { Component, VNode } from 'vue';
import { h } from 'vue';
import {
  getAdministrativeOperativeStatusLabel,
  getBillingStatusBadge,
} from '~/utils/administrative-rescue-display';
import {
  formatRescueCardMoney,
  getRescueServiceTypeBadge,
} from '~/utils/operational-rescue-card';

export type RescueTableBadgeComponents = {
  UBadge: Component;
  UIcon: Component;
};

export function renderRescueTableFolio(folio: string): VNode {
  return h('span', { class: 'font-semibold text-primary' }, folio);
}

export function renderRescueTableMoney(
  value: string | number | null | undefined,
): VNode {
  return h(
    'span',
    { class: 'font-mono tabular-nums' },
    formatRescueCardMoney(value),
  );
}

export function getRescueTableSupplierBadgeProps(
  supplierName: string | null | undefined,
): {
  label: string;
  color: 'neutral' | 'error';
  icon: string;
} {
  const name = supplierName?.trim();
  if (name) {
    return { label: name, color: 'neutral', icon: 'i-lucide-truck' };
  }

  return { label: 'Sin proveedor', color: 'error', icon: 'i-lucide-truck' };
}

export function renderRescueTableSupplierBadge(
  components: RescueTableBadgeComponents,
  supplierName: string | null | undefined,
): VNode {
  const { UBadge, UIcon } = components;
  const badge = getRescueTableSupplierBadgeProps(supplierName);

  return h(
    UBadge,
    {
      color: badge.color,
      variant: 'subtle',
      size: 'sm',
      class: 'max-w-full truncate',
    },
    () => [h(UIcon, { name: badge.icon, class: 'size-3.5' }), ` ${badge.label}`],
  );
}

export function getRescueTableServiceTypeBadgeProps(
  serviceType: string | null | undefined,
): ReturnType<typeof getRescueServiceTypeBadge> {
  return getRescueServiceTypeBadge(serviceType);
}

export function renderRescueTableServiceTypeBadge(
  components: RescueTableBadgeComponents,
  serviceType: string | null | undefined,
): VNode {
  const { UBadge, UIcon } = components;
  const badge = getRescueServiceTypeBadge(serviceType);

  return h(
    UBadge,
    {
      color: badge.color,
      variant: 'subtle',
      size: 'sm',
      class: 'shrink-0 uppercase tracking-wide',
    },
    () => [h(UIcon, { name: badge.icon, class: 'size-3.5' }), ` ${badge.label}`],
  );
}

export function renderRescueTableOperativeStatusBadge(
  components: Pick<RescueTableBadgeComponents, 'UBadge'>,
  status: string,
): VNode {
  const { UBadge } = components;
  const label = getAdministrativeOperativeStatusLabel(status);

  return h(UBadge, {
    color: 'neutral',
    variant: 'subtle',
    size: 'sm',
    label,
  });
}

export function renderRescueTableBillingStatusBadge(
  components: Pick<RescueTableBadgeComponents, 'UBadge'>,
  status: string | null | undefined,
): VNode {
  const { UBadge } = components;
  const badge = getBillingStatusBadge(status);

  return h(UBadge, {
    color: badge.color,
    variant: 'subtle',
    size: 'sm',
    label: badge.label,
  });
}
