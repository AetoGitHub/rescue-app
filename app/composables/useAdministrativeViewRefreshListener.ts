import { ref as dbRef } from 'firebase/database';
import { useDatabase, useDatabaseObject } from 'vuefire';
import { FIREBASE_ADMINISTRATIVE_VIEW_REFRESH_PATH } from '~/constants/firebase-rtdb';
import { RESCUE_ADMINISTRATIVE_TOAST } from '~/constants/rescue-administrative-flow';
import {
  invalidateAdministrativeBoardCards,
  readAdministrativeViewRefreshCount,
} from '~/utils/administrative-board-cache';

export function useAdministrativeViewRefreshListener() {
  if (!import.meta.client) {
    return;
  }

  const queryCache = useQueryCache();
  const toast = useToast();
  const db = useDatabase();
  const counterRef = dbRef(db, FIREBASE_ADMINISTRATIVE_VIEW_REFRESH_PATH);
  const counterData = useDatabaseObject(counterRef);

  const count = computed(() =>
    readAdministrativeViewRefreshCount(counterData.value),
  );

  const isReady = ref(false);
  const lastCount = ref<number | null>(null);

  watch(count, async (next) => {
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
    await invalidateAdministrativeBoardCards(queryCache);
    toast.add({
      title: RESCUE_ADMINISTRATIVE_TOAST.rescueUpdated,
      color: 'info',
    });
  });
}
