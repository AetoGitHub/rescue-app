import type {
  SlaLevelAlertConfig,
  SlaTimePerStage,
  SlaUpdateChatConfig, SlaDurationUnit 
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

function toDurationUnit(value: unknown): SlaDurationUnit {
  const unit = String(value ?? 'minutes');
  if (unit === 'hours' || unit === 'days') return unit;
  return 'minutes';
}

function extractResults(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload as Record<string, unknown>[];
  }
  if (
    payload &&
    typeof payload === 'object' &&
    Array.isArray((payload as { results?: unknown }).results)
  ) {
    return (payload as { results: Record<string, unknown>[] }).results;
  }
  return [];
}

export function mapSlaTimePerStageFromApi(
  raw: Record<string, unknown>,
): SlaTimePerStage {
  return {
    id: toNullableId(raw.id),
    service_type: String(
      raw.service_type ?? 'rescue',
    ) as SlaTimePerStage['service_type'],
    operative_status: String(
      raw.operative_status ?? 'active_without_quote',
    ) as SlaTimePerStage['operative_status'],
    time: toNumber(raw.time, 60),
    unit: toDurationUnit(raw.unit),
  };
}

export function mapSlaTimePerStageToApiBody(row: SlaTimePerStage) {
  return {
    service_type: row.service_type,
    operative_status: row.operative_status,
    time: row.time,
    unit: row.unit,
  };
}

export function mapSlaTimePerStageListFromApi(payload: unknown): SlaTimePerStage[] {
  return extractResults(payload).map(mapSlaTimePerStageFromApi);
}

export function mapSlaLevelAlertFromApi(
  raw: Record<string, unknown>,
): SlaLevelAlertConfig {
  return {
    id: toNullableId(raw.id),
    name: String(raw.name ?? ''),
    percentage_limit: toNumber(raw.percentage_limit, 0),
    color: String(raw.color ?? '#6366f1'),
    notify_gestor: toBoolean(raw.notify_gestor, false),
    notify_admin: toBoolean(raw.notify_admin, false),
    notify_direccion: toBoolean(raw.notify_direccion, false),
  };
}

export function mapSlaLevelAlertToApiBody(level: SlaLevelAlertConfig) {
  return {
    name: level.name.trim(),
    percentage_limit: level.percentage_limit,
    color: level.color,
    notify_gestor: level.notify_gestor,
    notify_admin: level.notify_admin,
    notify_direccion: level.notify_direccion,
  };
}

export function mapSlaLevelAlertListFromApi(
  payload: unknown,
): SlaLevelAlertConfig[] {
  return extractResults(payload).map(mapSlaLevelAlertFromApi);
}

export function mapSlaUpdateChatFromApi(
  raw: Record<string, unknown>,
): SlaUpdateChatConfig {
  return {
    id: toNullableId(raw.id),
    service_type: String(
      raw.service_type ?? 'rescue',
    ) as SlaUpdateChatConfig['service_type'],
    operative_status: String(
      raw.operative_status ?? 'in_progress',
    ) as SlaUpdateChatConfig['operative_status'],
    yellow_time: toNumber(raw.yellow_time, 30),
    yellow_unit: toDurationUnit(raw.yellow_unit),
    red_time: toNumber(raw.red_time, 60),
    red_unit: toDurationUnit(raw.red_unit),
  };
}

export function mapSlaUpdateChatToApiBody(row: SlaUpdateChatConfig) {
  return {
    service_type: row.service_type,
    operative_status: row.operative_status,
    yellow_time: row.yellow_time,
    yellow_unit: row.yellow_unit,
    red_time: row.red_time,
    red_unit: row.red_unit,
  };
}

export function mapSlaUpdateChatListFromApi(
  payload: unknown,
): SlaUpdateChatConfig[] {
  return extractResults(payload).map(mapSlaUpdateChatFromApi);
}
