import { h, type VNode } from 'vue';

export function rescueDetailHref(rescueId: number): string {
  return `/admin/operational?rescue=${rescueId}`;
}

function isModifiedClick(event: MouseEvent): boolean {
  return event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey;
}

/**
 * Folio de rescate enlazado al detalle cuando se conoce el id.
 * Con `onOpen`, el clic normal abre el modal en la misma pantalla;
 * Ctrl/Cmd/clic medio siguen abriendo el detalle en otra pestaña.
 * Sin id (o sin folio) se muestra como texto plano.
 */
export function renderRescueFolioLink(
  folio: string | null | undefined,
  rescueId: number | null | undefined,
  options?: { class?: string; onOpen?: (rescueId: number) => void },
): VNode {
  const label = folio?.trim() || '—';
  const baseClass = options?.class ?? 'font-medium';

  if (!folio?.trim() || rescueId == null) {
    return h('span', { class: baseClass }, label);
  }

  const onOpen = options?.onOpen;

  return h(
    'a',
    {
      href: rescueDetailHref(rescueId),
      target: '_blank',
      rel: 'noopener',
      class: `${baseClass} text-primary underline-offset-2 hover:underline`,
      title: `Ver detalle del rescate ${label}`,
      onClick: (event: MouseEvent) => {
        event.stopPropagation();
        if (!onOpen || isModifiedClick(event)) return;
        event.preventDefault();
        onOpen(rescueId);
      },
    },
    label,
  );
}
