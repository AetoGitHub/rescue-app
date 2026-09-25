import { RESCUE_DROPDOWN_PATH } from '~/constants/rescue-admin-doc-api';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import type { RescueDetailTarget } from '~/utils/rescue-folio-link';

/**
 * Monta el modal de detalle operativo bajo demanda (lazy) y lo abre por id.
 * Si el item no trae id, lo resuelve por folio con el dropdown de rescates.
 * Pensado para pantallas fuera del board operativo (pagos, saldo, recibos).
 */
export function useRescueDetailModalLauncher() {
  const apiFetch = useApiFetch();
  const toast = useToast();

  const rescueDetailModalMounted = ref(false);
  const rescueDetailModalRef = ref<{
    open: (id: number) => void;
    close: () => void;
  } | null>(null);
  const pendingId = ref<number | null>(null);
  const resolvedIdByFolio = new Map<string, number>();

  function openById(id: number) {
    if (rescueDetailModalRef.value) {
      rescueDetailModalRef.value.open(id);
      return;
    }
    pendingId.value = id;
    rescueDetailModalMounted.value = true;
  }

  async function resolveIdByFolio(folio: string): Promise<number | null> {
    const cached = resolvedIdByFolio.get(folio);
    if (cached != null) return cached;

    const response = await apiFetch<PaginatedResponse<{ id: number; folio: string }>>(
      RESCUE_DROPDOWN_PATH,
      { query: { folio } },
    );
    const normalized = folio.toLowerCase();
    const match = response.results.find(
      (row) => row.folio?.trim().toLowerCase() === normalized,
    );
    if (!match) return null;

    resolvedIdByFolio.set(folio, match.id);
    return match.id;
  }

  async function openRescueDetail(target: RescueDetailTarget) {
    if (target.id != null) {
      openById(target.id);
      return;
    }

    try {
      const id = await resolveIdByFolio(target.folio);
      if (id == null) {
        toast.add({
          title: 'No se encontró el rescate',
          description: `Folio ${target.folio}`,
          color: 'error',
        });
        return;
      }
      openById(id);
    } catch (error) {
      toast.add({
        title: 'No se pudo abrir el rescate',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
    }
  }

  watch(rescueDetailModalRef, (modal) => {
    if (modal && pendingId.value != null) {
      modal.open(pendingId.value);
      pendingId.value = null;
    }
  });

  return {
    rescueDetailModalMounted,
    rescueDetailModalRef,
    openRescueDetail,
  };
}
