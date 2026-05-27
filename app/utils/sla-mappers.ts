import type {
  SlaAlertLevelConfig,
  SlaChatIdleAlertConfig,
  SlaStageConfig,
} from '~/interfaces/sla';

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1 || value === '1') return true;
  if (value === 'false' || value === 0 || value === '0') return false;
  return fallback;
}

function toNullableId(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function mapSlaStageFromApi(raw: Record<string, unknown>): SlaStageConfig {
  return {
    id: toNullableId(raw.id),
    service_type: String(raw.service_type ?? 'rescue') as SlaStageConfig['service_type'],
    stage_name: String(raw.stage_name ?? ''),
    from_status: String(raw.from_status ?? 'active_without_quote') as SlaStageConfig['from_status'],
    to_status: String(raw.to_status ?? 'pending_authorization') as SlaStageConfig['to_status'],
    limit_minutes: toNumber(raw.limit_minutes, 60),
    is_active: toBoolean(raw.is_active, true),
  };
}

export function mapSlaStageToApiBody(stage: SlaStageConfig) {
  return {
    id: stage.id,
    service_type: stage.service_type,
    stage_name: stage.stage_name.trim(),
    from_status: stage.from_status,
    to_status: stage.to_status,
    limit_minutes: stage.limit_minutes,
    is_active: stage.is_active,
  };
}

export function mapSlaAlertLevelFromApi(
  raw: Record<string, unknown>,
): SlaAlertLevelConfig {
  return {
    id: toNullableId(raw.id),
    name: String(raw.name ?? ''),
    threshold_percent: toNumber(raw.threshold_percent, 0),
    color: String(raw.color ?? '#6366f1'),
    is_active: toBoolean(raw.is_active, true),
    notify_assigned_manager: toBoolean(raw.notify_assigned_manager, false),
    notify_admin: toBoolean(raw.notify_admin, false),
    notify_direction: toBoolean(raw.notify_direction, false),
  };
}

export function mapSlaAlertLevelToApiBody(level: SlaAlertLevelConfig) {
  return {
    id: level.id,
    name: level.name.trim(),
    threshold_percent: level.threshold_percent,
    color: level.color,
    is_active: level.is_active,
    notify_assigned_manager: level.notify_assigned_manager,
    notify_admin: level.notify_admin,
    notify_direction: level.notify_direction,
  };
}

export function mapSlaChatIdleAlertFromApi(
  raw: Record<string, unknown>,
): SlaChatIdleAlertConfig {
  return {
    id: toNullableId(raw.id),
    service_type: String(raw.service_type ?? 'rescue') as SlaChatIdleAlertConfig['service_type'],
    operative_status: String(
      raw.operative_status ?? 'in_progress',
    ) as SlaChatIdleAlertConfig['operative_status'],
    yellow_limit_minutes: toNumber(raw.yellow_limit_minutes, 30),
    red_limit_minutes: toNumber(raw.red_limit_minutes, 60),
    is_active: toBoolean(raw.is_active, true),
  };
}

export function mapSlaChatIdleAlertToApiBody(alert: SlaChatIdleAlertConfig) {
  return {
    id: alert.id,
    service_type: alert.service_type,
    operative_status: alert.operative_status,
    yellow_limit_minutes: alert.yellow_limit_minutes,
    red_limit_minutes: alert.red_limit_minutes,
    is_active: alert.is_active,
  };
}

export function mapSlaStageListFromApi(
  payload: unknown,
): SlaStageConfig[] {
  if (Array.isArray(payload)) {
    return payload.map((item) =>
      mapSlaStageFromApi(item as Record<string, unknown>),
    );
  }
  if (payload && typeof payload === 'object' && Array.isArray((payload as { results?: unknown }).results)) {
    return ((payload as { results: Record<string, unknown>[] }).results).map(
      mapSlaStageFromApi,
    );
  }
  return [];
}

export function mapSlaAlertLevelListFromApi(payload: unknown): SlaAlertLevelConfig[] {
  if (Array.isArray(payload)) {
    return payload.map((item) =>
      mapSlaAlertLevelFromApi(item as Record<string, unknown>),
    );
  }
  if (payload && typeof payload === 'object' && Array.isArray((payload as { results?: unknown }).results)) {
    return ((payload as { results: Record<string, unknown>[] }).results).map(
      mapSlaAlertLevelFromApi,
    );
  }
  return [];
}

export function mapSlaChatIdleAlertListFromApi(
  payload: unknown,
): SlaChatIdleAlertConfig[] {
  if (Array.isArray(payload)) {
    return payload.map((item) =>
      mapSlaChatIdleAlertFromApi(item as Record<string, unknown>),
    );
  }
  if (payload && typeof payload === 'object' && Array.isArray((payload as { results?: unknown }).results)) {
    return ((payload as { results: Record<string, unknown>[] }).results).map(
      mapSlaChatIdleAlertFromApi,
    );
  }
  return [];
}
