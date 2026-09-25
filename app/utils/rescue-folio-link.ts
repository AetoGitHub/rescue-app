import { h, type VNode } from 'vue';

export interface RescueDetailTarget {
  id: number | null;
  folio: string;
}

export function rescueDetailHref(rescueId: number): string {
  return `/admin/operational?rescue=${rescueId}`;
}

/**
 * Folio de rescate que abre el modal de detalle en la misma pantalla.
 * Abrir en otra pestaña se hace desde el botón dentro del modal.
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

  if (!folio?.trim() || !onOpen) {
    return h('span', { class: baseClass }, label);
  }

  return h(
    'button',
    {
      type: 'button',
      class: `${baseClass} cursor-pointer text-primary underline-offset-2 hover:underline`,
      title: `Ver detalle del rescate ${label}`,
      onClick: (event: MouseEvent) => {
        event.stopPropagation();
        onOpen({ id: rescueId ?? null, folio: label });
      },
    },
    label,
  );
}
