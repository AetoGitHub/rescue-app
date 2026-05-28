import type { OperationalRescueStatus } from '~/constants/operational-kanban';
import type { RescueServiceType } from '~/interfaces/rescue';

export type SlaDurationUnit = 'minutes' | 'hours' | 'days';

export interface SlaTimePerStage {
  id: number | null;
  service_type: RescueServiceType;
  operative_status: OperationalRescueStatus;
  time: number;
  unit: SlaDurationUnit;
}

export interface SlaTimePerStageRow extends SlaTimePerStage {
  _dirty?: boolean;
  _isNew?: boolean;
}

export interface SlaLevelAlertConfig {
  id: number | null;
  name: string;
  percentage_limit: number;
  color: string;
  notify_gestor: boolean;
  notify_admin: boolean;
  notify_direccion: boolean;
}

export interface SlaLevelAlertConfigRow extends SlaLevelAlertConfig {
  _dirty?: boolean;
  _isNew?: boolean;
}

export interface SlaUpdateChatConfig {
  id: number | null;
  service_type: RescueServiceType;
  operative_status: OperationalRescueStatus;
  yellow_time: number;
  yellow_unit: SlaDurationUnit;
  red_time: number;
  red_unit: SlaDurationUnit;
}

export interface SlaUpdateChatConfigRow extends SlaUpdateChatConfig {
  _dirty?: boolean;
  _isNew?: boolean;
}
