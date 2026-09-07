import { onValue, ref as dbRef } from 'firebase/database';
import { useDatabase } from 'vuefire';
import { FIREBASE_ADMINISTRATIVE_VIEW_REFRESH_PATH } from '~/constants/firebase-rtdb';
import { readAdministrativeViewRefreshCount } from '~/utils/administrative-board-cache';
import { invalidatePendingInvoiceCaches } from '~/utils/pending-invoice-cache';

/**
 * Listens to the same RTDB leaf as the admin panel
 * (`rescue_2/counters/general/administrative_view_refresh`). Skips the first
 * snapshot as baseline; later changes refresh Por Facturar's cached queries.
 */
export function usePendingInvoiceViewRefreshListener(onRefresh?: () => void) {
  if (!import.meta.client) {
    return;
  }

  const queryCache = useQueryCache();
  const db = useDatabase();
  const counterRef = dbRef(db, FIREBASE_ADMINISTRATIVE_VIEW_REFRESH_PATH);

  const isReady = ref(false);
  const lastCount = ref<number | null>(null);

  const unsubscribe = onValue(counterRef, (snapshot) => {
    const next = readAdministrativeViewRefreshCount(snapshot.val());
    if (next == null) {
      return;
    }

    if (!isReady.value) {
      lastCount.value = next;
      isReady.value = true;
      return;
    }

    if (next === lastCount.value) {
      return;
    }

    lastCount.value = next;
    void invalidatePendingInvoiceCaches(queryCache).then(() => {
      onRefresh?.();
    });
  });

  onScopeDispose(() => {
    unsubscribe();
  });
}
