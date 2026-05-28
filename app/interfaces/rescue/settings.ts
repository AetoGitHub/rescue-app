import type {
  SlaLevelAlertConfig,
  SlaTimePerStage,
  SlaUpdateChatConfig,
} from '~/interfaces/sla';

export interface RescueGeneralSettings {
  sla: {
    time_per_stage: SlaTimePerStage[];
    update_chat: SlaUpdateChatConfig[];
    level_alerts: SlaLevelAlertConfig[];
  };
}

export const RESCUE_GENERAL_SETTINGS_PATH = '/api/rescue/settings/general/';
