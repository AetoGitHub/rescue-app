import type { Ref } from 'vue';
import {
  parseRescueBoardViewMode,
  rescueBoardViewQueryValue,
  type RescueBoardViewMode,
} from '~/utils/rescue-board-view-query';

export function useRescueBoardViewMode(): {
  viewMode: Ref<RescueBoardViewMode>;
  setViewMode: (mode: RescueBoardViewMode) => Promise<void>;
} {
  const route = useRoute();
  const router = useRouter();
  const isSyncing = ref(false);

  const viewMode = ref<RescueBoardViewMode>(
    parseRescueBoardViewMode(route.query.view),
  );

  watch(
    () => route.query.view,
    (raw) => {
      if (isSyncing.value) return;
      const parsed = parseRescueBoardViewMode(raw);
      if (viewMode.value !== parsed) {
        viewMode.value = parsed;
      }
    },
  );

  async function setViewMode(mode: RescueBoardViewMode) {
    if (viewMode.value === mode) {
      const queryValue = rescueBoardViewQueryValue(mode);
      const current = route.query.view;
      if (queryValue === undefined && (current == null || current === '')) {
        return;
      }
      if (current === queryValue) {
        return;
      }
    }

    viewMode.value = mode;

    const query = { ...route.query };
    const nextValue = rescueBoardViewQueryValue(mode);

    if (nextValue == null) {
      delete query.view;
    } else {
      query.view = nextValue;
    }

    isSyncing.value = true;
    try {
      await router.replace({ query });
    } finally {
      isSyncing.value = false;
    }
  }

  return {
    viewMode,
    setViewMode,
  };
}
