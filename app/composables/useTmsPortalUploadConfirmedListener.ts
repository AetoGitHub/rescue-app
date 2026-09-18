import { onValue, ref as dbRef } from 'firebase/database';
import { useDatabase } from 'vuefire';
import { FIREBASE_TMS_PORTAL_UPLOAD_CONFIRMED_PATH } from '~/constants/firebase-rtdb';
import { readAdministrativeViewRefreshCount } from '~/utils/administrative-board-cache';

/**
 * Listens to RTDB leaf `rescue_2/counters/client_portal/tms/upload_confirmed`
 * (plain number). Skips the first snapshot as baseline; later changes trigger
 * a soft refresh of the TMS portal table (drafts in progress are preserved by
 * `useTmsRescueList`/the page's draft cache, which only fills gaps).
 */
export function useTmsPortalUploadConfirmedListener(onRefresh: () => void) {
  if (!import.meta.client) {
    return;
  }

  const db = useDatabase();
  const counterRef = dbRef(db, FIREBASE_TMS_PORTAL_UPLOAD_CONFIRMED_PATH);

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
    onRefresh();
  });

  onScopeDispose(() => {
    unsubscribe();
  });
}
