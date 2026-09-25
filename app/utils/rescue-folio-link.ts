import { h, type VNode } from 'vue';

export interface RescueDetailTarget {
  id: number | null;
  folio: string;
}

export function rescueDetailHref(rescueId: number): string {
  return `/admin/operational?rescue=${rescueId}`;
}

function isModifiedClick(event: MouseEvent): boolean {
  return event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey;
}

/**
 * Folio de rescate que abre el detalle.
 * Con `onOpen`, el clic normal abre el modal en la misma pantalla (si no hay id,
 * `onOpen` lo resuelve por folio); con id, Ctrl/Cmd/clic medio abren otra pestaña.
 * Sin folio, o sin id ni `onOpen`, se muestra como texto plano.
 */
export function renderRescueFolioLink(
  folio: string | null | undefined,
  rescueId: number | null | undefined,
  options?: { class?: string; onOpen?: (target: RescueDetailTarget) => void },
): VNode {
  const label = folio?.trim() || '—';
  const baseClass = options?.class ?? 'font-medium';
  const onOpen = options?.onOpen;
  const linkClass = `${baseClass} cursor-pointer text-primary underline-offset-2 hover:underline`;
  const title = `Ver detalle del rescate ${label}`;
  const target: RescueDetailTarget = { id: rescueId ?? null, folio: label };

  if (!folio?.trim() || (rescueId == null && !onOpen)) {
    return h('span', { class: baseClass }, label);
  }

  if (rescueId == null) {
    return h(
      'button',
      {
        type: 'button',
        class: linkClass,
        title,
        onClick: (event: MouseEvent) => {
          event.stopPropagation();
          onOpen?.(target);
        },
      },
      label,
    );
  }

  return h(
    'a',
    {
      href: rescueDetailHref(rescueId),
      target: '_blank',
      rel: 'noopener',
      class: linkClass,
      title,
      onClick: (event: MouseEvent) => {
        event.stopPropagation();
        if (!onOpen || isModifiedClick(event)) return;
        event.preventDefault();
        onOpen(target);
      },
    },
    label,
  );
}
