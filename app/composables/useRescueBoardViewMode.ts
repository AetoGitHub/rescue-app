import type { ComputedRef } from 'vue';
import {
  parseRescueBoardViewMode,
  rescueBoardViewQueryValue,
  type RescueBoardViewMode,
} from '~/utils/rescue-board-view-query';

export function useRescueBoardViewMode(): {
  viewMode: ComputedRef<RescueBoardViewMode>;
  setViewMode: (mode: RescueBoardViewMode) => Promise<void>;
} {
  const route = useRoute();
  const router = useRouter();
  const { isMobile } = useResponsive();

  const viewMode = computed<RescueBoardViewMode>(() => {
    const explicit = parseRescueBoardViewMode(route.query.view);
    if (explicit) return explicit;
    return isMobile.value ? 'list' : 'kanban';
  });

  async function setViewMode(mode: RescueBoardViewMode) {
    const nextValue = rescueBoardViewQueryValue(mode);
    if (route.query.view === nextValue) return;

    await router.replace({
      query: { ...route.query, view: nextValue },
    });
  }

  return {
    viewMode,
    setViewMode,
  };
}
