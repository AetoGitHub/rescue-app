import type { OperationalRescueStatus } from '~/constants/operational-kanban';
import type { RescueServiceType } from '~/interfaces/rescue';

export type SlaDurationUnit = 'minutes' | 'hours' | 'days';

export interface SlaStageConfig {
  id: number | null;
  service_type: RescueServiceType;
  stage_name: string;
  from_status: OperationalRescueStatus;
  to_status: OperationalRescueStatus;
  limit_minutes: number;
  is_active: boolean;
}

export interface SlaStageConfigRow extends SlaStageConfig {
  _dirty?: boolean;
  _isNew?: boolean;
}

export interface SlaAlertLevelConfig {
  id: number | null;
  name: string;
  threshold_percent: number;
  color: string;
  is_active: boolean;
  notify_assigned_manager: boolean;
  notify_admin: boolean;
  notify_direction: boolean;
}

export interface SlaAlertLevelConfigRow extends SlaAlertLevelConfig {
  _dirty?: boolean;
  _isNew?: boolean;
}

export interface SlaChatIdleAlertConfig {
  id: number | null;
  service_type: RescueServiceType;
  operative_status: OperationalRescueStatus;
  yellow_limit_minutes: number;
  red_limit_minutes: number;
  is_active: boolean;
}

export interface SlaChatIdleAlertConfigRow extends SlaChatIdleAlertConfig {
  _dirty?: boolean;
  _isNew?: boolean;
}

export interface SlaStagesSaveBody {
  service_type: RescueServiceType;
  stages: Omit<SlaStageConfig, 'id'> & { id?: number | null }[];
}

export interface SlaAlertLevelsSaveBody {
  levels: Omit<SlaAlertLevelConfig, 'id'> & { id?: number | null }[];
}

export interface SlaChatIdleAlertsSaveBody {
  service_type: RescueServiceType;
  alerts: Omit<SlaChatIdleAlertConfig, 'id'> & { id?: number | null }[];
}
