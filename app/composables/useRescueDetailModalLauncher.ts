/**
 * Monta el modal de detalle operativo bajo demanda (lazy) y lo abre por id.
 * Pensado para pantallas fuera del board operativo (pagos, saldo, recibos).
 */
export function useRescueDetailModalLauncher() {
  const rescueDetailModalMounted = ref(false);
  const rescueDetailModalRef = ref<{
    open: (id: number) => void;
    close: () => void;
  } | null>(null);
  const pendingId = ref<number | null>(null);

  function openRescueDetail(id: number) {
    if (rescueDetailModalRef.value) {
      rescueDetailModalRef.value.open(id);
      return;
    }
    pendingId.value = id;
    rescueDetailModalMounted.value = true;
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
