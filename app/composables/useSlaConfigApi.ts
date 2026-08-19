import { SLA_API_PATHS } from '~/constants/sla-config';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import type {
  SlaLevelAlertConfig,
  SlaTimePerStage,
  SlaUpdateChatConfig,
} from '~/interfaces/sla';
import {
  mapSlaLevelAlertFromApi,
  mapSlaLevelAlertListFromApi,
  mapSlaLevelAlertToApiBody,
  mapSlaTimePerStageFromApi,
  mapSlaTimePerStageListFromApi,
  mapSlaTimePerStageToApiBody,
  mapSlaUpdateChatFromApi,
  mapSlaUpdateChatListFromApi,
  mapSlaUpdateChatToApiBody,
} from '~/utils/sla-mappers';

async function fetchAllPaginated<T>(
  apiFetch: ReturnType<typeof useApiFetch>,
  path: string,
  baseQuery?: Record<string, string>,
  mapItem?: (raw: Record<string, unknown>) => T,
): Promise<T[]> {
  const results: T[] = [];
  let cursor: string | null = null;

  do {
    const page = await apiFetch<PaginatedResponse<Record<string, unknown>>>(
      path,
      {
        query: buildPaginatedQuery(baseQuery, cursor),
      },
    );

    for (const raw of page.results) {
      results.push(mapItem ? mapItem(raw) : (raw as T));
    }

    cursor = extractCursorFromPaginatedNext(page.next);
  } while (cursor);

  return results;
}

/**
 * SLA API layer — TimePerStage, LevelAlert, UpdateChat.
 * Each resource: list (paginated) + create + update. No DELETE endpoints.
 */
export function useSlaConfigApi() {
  const apiFetch = useApiFetch();
  const mutationLocks = new Set<string>();

  async function runMutationLocked(
    key: string,
    mutation: () => Promise<unknown>,
  ): Promise<boolean> {
    if (mutationLocks.has(key)) return false;
    mutationLocks.add(key);
    try {
      await mutation();
      return true;
    } finally {
      mutationLocks.delete(key);
    }
  }

  async function listTimePerStage(): Promise<SlaTimePerStage[]> {
    const rows = await fetchAllPaginated(
      apiFetch,
      SLA_API_PATHS.timePerStage.list,
      undefined,
      mapSlaTimePerStageFromApi,
    );
    return rows.length > 0 ? rows : mapSlaTimePerStageListFromApi({ results: [] });
  }

  async function createTimePerStage(
    body: Omit<SlaTimePerStage, 'id'>,
  ): Promise<boolean> {
    const requestBody = mapSlaTimePerStageToApiBody({ id: null, ...body });
    return runMutationLocked(
      `time-per-stage:create:${JSON.stringify(requestBody)}`,
      async () => {
        const response = await apiFetch<{ id: number }>(
          SLA_API_PATHS.timePerStage.create,
          {
            method: 'POST',
            body: requestBody,
          },
        );
        return response.id;
      },
    );
  }

  async function updateTimePerStage(
    id: number,
    body: Omit<SlaTimePerStage, 'id'>,
  ): Promise<boolean> {
    return runMutationLocked(`time-per-stage:update:${id}`, async () => {
      await apiFetch(SLA_API_PATHS.timePerStage.update(id), {
        method: 'PUT',
        body: mapSlaTimePerStageToApiBody({ id, ...body }),
      });
    });
  }

  async function listLevelAlert(): Promise<SlaLevelAlertConfig[]> {
    const rows = await fetchAllPaginated(
      apiFetch,
      SLA_API_PATHS.levelAlert.list,
      undefined,
      mapSlaLevelAlertFromApi,
    );
    return rows.length > 0 ? rows : mapSlaLevelAlertListFromApi({ results: [] });
  }

  async function createLevelAlert(
    body: Omit<SlaLevelAlertConfig, 'id'>,
  ): Promise<boolean> {
    const requestBody = mapSlaLevelAlertToApiBody({ id: null, ...body });
    return runMutationLocked(
      `level-alert:create:${JSON.stringify(requestBody)}`,
      async () => {
        const response = await apiFetch<{ id: number }>(
          SLA_API_PATHS.levelAlert.create,
          {
            method: 'POST',
            body: requestBody,
          },
        );
        return response.id;
      },
    );
  }

  async function updateLevelAlert(
    id: number,
    body: Omit<SlaLevelAlertConfig, 'id'>,
  ): Promise<boolean> {
    return runMutationLocked(`level-alert:update:${id}`, async () => {
      await apiFetch(SLA_API_PATHS.levelAlert.update(id), {
        method: 'PUT',
        body: mapSlaLevelAlertToApiBody({ id, ...body }),
      });
    });
  }

  async function listUpdateChat(): Promise<SlaUpdateChatConfig[]> {
    const rows = await fetchAllPaginated(
      apiFetch,
      SLA_API_PATHS.updateChat.list,
      undefined,
      mapSlaUpdateChatFromApi,
    );
    return rows.length > 0 ? rows : mapSlaUpdateChatListFromApi({ results: [] });
  }

  async function createUpdateChat(
    body: Omit<SlaUpdateChatConfig, 'id'>,
  ): Promise<boolean> {
    const requestBody = mapSlaUpdateChatToApiBody({ id: null, ...body });
    return runMutationLocked(
      `update-chat:create:${JSON.stringify(requestBody)}`,
      async () => {
        const response = await apiFetch<{ id: number }>(
          SLA_API_PATHS.updateChat.create,
          {
            method: 'POST',
            body: requestBody,
          },
        );
        return response.id;
      },
    );
  }

  async function updateUpdateChat(
    id: number,
    body: Omit<SlaUpdateChatConfig, 'id'>,
  ): Promise<boolean> {
    return runMutationLocked(`update-chat:update:${id}`, async () => {
      await apiFetch(SLA_API_PATHS.updateChat.update(id), {
        method: 'PUT',
        body: mapSlaUpdateChatToApiBody({ id, ...body }),
      });
    });
  }

  return {
    listTimePerStage,
    createTimePerStage,
    updateTimePerStage,
    listLevelAlert,
    createLevelAlert,
    updateLevelAlert,
    listUpdateChat,
    createUpdateChat,
    updateUpdateChat,
  };
}
