import { h, type VNode } from 'vue';

export function rescueDetailHref(rescueId: number): string {
  return `/admin/operational?rescue=${rescueId}`;
}

/**
 * Folio de rescate que abre el detalle en otra pestaña cuando se conoce el id.
 * Sin id (o sin folio) se muestra como texto plano.
 */
export function renderRescueFolioLink(
  folio: string | null | undefined,
  rescueId: number | null | undefined,
  options?: { class?: string },
): VNode {
  const label = folio?.trim() || '—';
  const baseClass = options?.class ?? 'font-medium';

  if (!folio?.trim() || rescueId == null) {
    return h('span', { class: baseClass }, label);
  }

  return h(
    'a',
    {
      href: rescueDetailHref(rescueId),
      target: '_blank',
      rel: 'noopener',
      class: `${baseClass} text-primary underline-offset-2 hover:underline`,
      title: `Abrir detalle del rescate ${label}`,
      onClick: (event: MouseEvent) => event.stopPropagation(),
    },
    label,
  );
}
