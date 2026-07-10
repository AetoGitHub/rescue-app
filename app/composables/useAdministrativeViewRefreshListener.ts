import { onValue, ref as dbRef } from 'firebase/database';
import { useDatabase } from 'vuefire';
import { FIREBASE_ADMINISTRATIVE_VIEW_REFRESH_PATH } from '~/constants/firebase-rtdb';
import { RESCUE_ADMINISTRATIVE_TOAST } from '~/constants/rescue-administrative-flow';
import {
  invalidateAdministrativeBoardCards,
  readAdministrativeViewRefreshCount,
} from '~/utils/administrative-board-cache';

/**
 * Listens to RTDB leaf `rescue_2/counters/general/administrative_view_refresh`
 * (plain number). Skips the first snapshot as baseline; later changes refresh
 * the administrative board cards and show a toast.
 */
export function useAdministrativeViewRefreshListener() {
  if (!import.meta.client) {
    return;
  }

  const queryCache = useQueryCache();
  const toast = useToast();
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
    void invalidateAdministrativeBoardCards(queryCache).then(() => {
      toast.add({
        title: RESCUE_ADMINISTRATIVE_TOAST.rescueUpdated,
        color: 'info',
      });
    });
  });

  onScopeDispose(() => {
    unsubscribe();
  });
}
