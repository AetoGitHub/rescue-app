import { useQuery } from '@pinia/colada';
import type { RescueGeneralSettings } from '~/interfaces/rescue/settings';
import { RESCUE_GENERAL_SETTINGS_PATH } from '~/interfaces/rescue/settings';
import {
  mapSlaLevelAlertFromApi,
  mapSlaTimePerStageFromApi,
  mapSlaUpdateChatFromApi,
} from '~/utils/sla-mappers';

const SETTINGS_STALE_TIME_MS = 5 * 60 * 1000;

function mapRescueGeneralSettingsFromApi(
  raw: Record<string, unknown>,
): RescueGeneralSettings {
  const slaRaw = raw.sla;
  const sla =
    slaRaw && typeof slaRaw === 'object'
      ? (slaRaw as Record<string, unknown>)
      : {};

  const timePerStage = Array.isArray(sla.time_per_stage)
    ? sla.time_per_stage.map((item) =>
        mapSlaTimePerStageFromApi(item as Record<string, unknown>),
      )
    : [];

  const updateChat = Array.isArray(sla.update_chat)
    ? sla.update_chat.map((item) =>
        mapSlaUpdateChatFromApi(item as Record<string, unknown>),
      )
    : [];

  const levelAlerts = Array.isArray(sla.level_alerts)
    ? sla.level_alerts.map((item) =>
        mapSlaLevelAlertFromApi(item as Record<string, unknown>),
      )
    : [];

  return {
    sla: {
      time_per_stage: timePerStage,
      update_chat: updateChat,
      level_alerts: levelAlerts,
    },
  };
}

export function useRescueGeneralSettings() {
  const apiFetch = useApiFetch();

  const { data, asyncStatus, error, refresh } = useQuery({
    key: () => ['rescue-settings-general'],
    query: ({ signal }) =>
      apiFetch<Record<string, unknown>>(RESCUE_GENERAL_SETTINGS_PATH, {
        signal,
      }),
    staleTime: SETTINGS_STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });

  const settings = computed(() =>
    data.value ? mapRescueGeneralSettingsFromApi(data.value) : null,
  );

  const isPending = computed(() => asyncStatus.value === 'loading');

  return {
    settings,
    isPending,
    error,
    refresh,
  };
}
