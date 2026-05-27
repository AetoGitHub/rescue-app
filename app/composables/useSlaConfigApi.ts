import { SLA_API_PATHS } from '~/constants/sla-config';
import type { RescueServiceType } from '~/interfaces/rescue';
import type {
  SlaAlertLevelConfig,
  SlaChatIdleAlertConfig,
  SlaStageConfig,
} from '~/interfaces/sla';
import {
  mapSlaAlertLevelListFromApi,
  mapSlaAlertLevelToApiBody,
  mapSlaChatIdleAlertListFromApi,
  mapSlaChatIdleAlertToApiBody,
  mapSlaStageListFromApi,
  mapSlaStageToApiBody,
} from '~/utils/sla-mappers';

/**
 * SLA API layer. Adjust paths in SLA_API_PATHS when backend is ready.
 *
 * Suggested contracts:
 * - GET  /api/sla/stages/           → list all stage configs
 * - PUT  /api/sla/stages/           → { service_type, stages: [...] }
 * - DELETE /api/sla/stages/:id/
 * - GET/PUT /api/sla/alert-levels/  → list / replace all levels
 * - GET/PUT /api/sla/chat-idle-alerts/ → list / { service_type, alerts }
 */
export function useSlaConfigApi() {
  async function listStages(): Promise<SlaStageConfig[]> {
    const payload = await $fetch<unknown>(SLA_API_PATHS.stages);
    return mapSlaStageListFromApi(payload);
  }

  async function saveStagesBatch(
    serviceType: RescueServiceType,
    stages: SlaStageConfig[],
  ): Promise<void> {
    await $fetch(SLA_API_PATHS.stages, {
      method: 'PUT',
      body: {
        service_type: serviceType,
        stages: stages.map(mapSlaStageToApiBody),
      },
    });
  }

  async function deleteStage(id: number): Promise<void> {
    await $fetch(`${SLA_API_PATHS.stages}${id}/`, {
      method: 'DELETE',
    });
  }

  async function listAlertLevels(): Promise<SlaAlertLevelConfig[]> {
    const payload = await $fetch<unknown>(SLA_API_PATHS.alertLevels);
    return mapSlaAlertLevelListFromApi(payload);
  }

  async function saveAlertLevels(levels: SlaAlertLevelConfig[]): Promise<void> {
    await $fetch(SLA_API_PATHS.alertLevels, {
      method: 'PUT',
      body: {
        levels: levels.map(mapSlaAlertLevelToApiBody),
      },
    });
  }

  async function deleteAlertLevel(id: number): Promise<void> {
    await $fetch(`${SLA_API_PATHS.alertLevels}${id}/`, {
      method: 'DELETE',
    });
  }

  async function listChatIdleAlerts(): Promise<SlaChatIdleAlertConfig[]> {
    const payload = await $fetch<unknown>(SLA_API_PATHS.chatIdleAlerts);
    return mapSlaChatIdleAlertListFromApi(payload);
  }

  async function saveChatIdleAlertsBatch(
    serviceType: RescueServiceType,
    alerts: SlaChatIdleAlertConfig[],
  ): Promise<void> {
    await $fetch(SLA_API_PATHS.chatIdleAlerts, {
      method: 'PUT',
      body: {
        service_type: serviceType,
        alerts: alerts.map(mapSlaChatIdleAlertToApiBody),
      },
    });
  }

  async function deleteChatIdleAlert(id: number): Promise<void> {
    await $fetch(`${SLA_API_PATHS.chatIdleAlerts}${id}/`, {
      method: 'DELETE',
    });
  }

  return {
    listStages,
    saveStagesBatch,
    deleteStage,
    listAlertLevels,
    saveAlertLevels,
    deleteAlertLevel,
    listChatIdleAlerts,
    saveChatIdleAlertsBatch,
    deleteChatIdleAlert,
  };
}
