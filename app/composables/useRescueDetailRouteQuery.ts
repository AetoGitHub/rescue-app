import type { Ref } from 'vue';
import { parseRescueQueryParam } from '~/utils/rescue-detail-query';

export interface RescueDetailModalHandle {
  close: () => void;
}

export function useRescueDetailRouteQuery(options: {
  getModalRef: () => RescueDetailModalHandle | null;
  ensureMounted: () => void;
  openModal: (id: number) => void;
  pendingId?: Ref<number | null>;
  onPendingOpen?: (id: number) => void;
}) {
  const route = useRoute();
  const router = useRouter();
  const isSyncing = ref(false);

  async function setRescueQuery(id: number | null) {
    const query = { ...route.query };
    const current = parseRescueQueryParam(query.rescue);

    if (id == null) {
      if (query.rescue == null) return;
      delete query.rescue;
    } else if (current === id) {
      return;
    } else {
      query.rescue = String(id);
    }

    isSyncing.value = true;
    try {
      await router.replace({ query });
    } finally {
      isSyncing.value = false;
    }
  }

  function openModalForId(id: number) {
    options.ensureMounted();
    if (options.getModalRef()) {
      options.openModal(id);
      return;
    }
    if (options.onPendingOpen) {
      options.onPendingOpen(id);
    } else if (options.pendingId) {
      options.pendingId.value = id;
    }
  }

  function openRescue(id: number, openOptions?: { skipModal?: boolean }) {
    if (!openOptions?.skipModal) {
      openModalForId(id);
    }
    void setRescueQuery(id);
  }

  function closeRescueFromRoute() {
    void setRescueQuery(null);
  }

  function syncFromRoute() {
    if (isSyncing.value) return;

    const raw = route.query.rescue;
    const id = parseRescueQueryParam(raw);

    if (raw != null && id == null) {
      void setRescueQuery(null);
      options.getModalRef()?.close();
      return;
    }

    if (id == null) {
      options.getModalRef()?.close();
      return;
    }

    openModalForId(id);
  }

  watch(() => route.query.rescue, syncFromRoute, { immediate: true });

  return {
    openRescue,
    closeRescueFromRoute,
    onModalClosed: closeRescueFromRoute,
  };
}
