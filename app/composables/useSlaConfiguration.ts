import type { InjectionKey } from 'vue';
import {
  getSlaRequestTypeLabel,
  SLA_DEFAULT_ALERT_LEVELS,
  SLA_PORTAL_FROM_STATUS,
  SLA_SERVICE_TYPES,
} from '~/constants/sla-config';
import type { OperationalRescueStatus } from '~/constants/operational-kanban';
import type { RescueServiceType } from '~/interfaces/rescue';
import type {
  SlaAlertLevelConfigRow,
  SlaChatIdleAlertConfigRow,
  SlaStageConfigRow,
} from '~/interfaces/sla';
import {
  slaAlertLevelRowSchema,
  slaChatIdleAlertRowSchema,
  slaStageRowSchema,
} from '~/schemas/sla-config';
function cloneStageRow(stage: SlaStageConfigRow): SlaStageConfigRow {
  return { ...stage, _dirty: false, _isNew: false };
}

function cloneAlertRow(level: SlaAlertLevelConfigRow): SlaAlertLevelConfigRow {
  return { ...level, _dirty: false, _isNew: false };
}

function cloneChatRow(alert: SlaChatIdleAlertConfigRow): SlaChatIdleAlertConfigRow {
  return { ...alert, _dirty: false, _isNew: false };
}

function defaultStageForType(serviceType: RescueServiceType): SlaStageConfigRow {
  const defaults: Record<
    RescueServiceType,
    { from: OperationalRescueStatus; to: OperationalRescueStatus; name: string }
  > = {
    rescue: {
      from: 'active_without_quote',
      to: 'pending_authorization',
      name: 'Cotización',
    },
    loan: {
      from: 'pending_authorization',
      to: 'approved',
      name: 'Autorización',
    },
    direct_budget: {
      from: 'active_without_quote',
      to: 'approved',
      name: 'Cotización directa',
    },
    proyect: {
      from: 'approved',
      to: 'in_progress',
      name: 'Inicio de proyecto',
    },
  };
  const d = defaults[serviceType];
  return {
    id: null,
    service_type: serviceType,
    stage_name: d.name,
    from_status: d.from,
    to_status: d.to,
    limit_minutes: 60,
    is_active: true,
    _dirty: true,
    _isNew: true,
  };
}

function defaultChatRow(serviceType: RescueServiceType): SlaChatIdleAlertConfigRow {
  return {
    id: null,
    service_type: serviceType,
    operative_status: 'in_progress',
    yellow_limit_minutes: 30,
    red_limit_minutes: 60,
    is_active: true,
    _dirty: true,
    _isNew: true,
  };
}

function defaultAlertLevel(
  seed: (typeof SLA_DEFAULT_ALERT_LEVELS)[number],
): SlaAlertLevelConfigRow {
  return {
    id: null,
    ...seed,
    _dirty: false,
    _isNew: false,
  };
}

export type SlaConfigurationContext = ReturnType<typeof useSlaConfiguration>;

export const slaConfigurationKey: InjectionKey<SlaConfigurationContext> =
  Symbol('slaConfiguration');

export function useSlaConfigurationInject() {
  const ctx = inject(slaConfigurationKey);
  if (!ctx) {
    throw new Error('useSlaConfigurationInject requires slaConfigurationKey provider');
  }
  return ctx;
}

export function useSlaConfiguration() {
  const toast = useToast();
  const api = useSlaConfigApi();

  const stages = ref<SlaStageConfigRow[]>([]);
  const alertLevels = ref<SlaAlertLevelConfigRow[]>([]);
  const chatAlerts = ref<SlaChatIdleAlertConfigRow[]>([]);
  const loadStatus = ref<'idle' | 'loading' | 'error'>('idle');
  const savingKeys = ref<Set<string>>(new Set());

  function isSaving(key: string) {
    return savingKeys.value.has(key);
  }

  function setSaving(key: string, active: boolean) {
    const next = new Set(savingKeys.value);
    if (active) next.add(key);
    else next.delete(key);
    savingKeys.value = next;
  }

  function stagesForType(serviceType: RescueServiceType, portalOnly = false) {
    return stages.value.filter((row) => {
      if (row.service_type !== serviceType) return false;
      if (portalOnly) return row.from_status === SLA_PORTAL_FROM_STATUS;
      return row.from_status !== SLA_PORTAL_FROM_STATUS;
    });
  }

  function portalStages() {
    return stages.value.filter((row) => row.from_status === SLA_PORTAL_FROM_STATUS);
  }

  function chatForType(serviceType: RescueServiceType) {
    return chatAlerts.value.filter((row) => row.service_type === serviceType);
  }

  function hasDirtyStagesForType(serviceType: RescueServiceType, portalOnly = false) {
    return stagesForType(serviceType, portalOnly).some((row) => row._dirty);
  }

  function hasDirtyChatForType(serviceType: RescueServiceType) {
    return chatForType(serviceType).some((row) => row._dirty);
  }

  const hasDirtyAlertLevels = computed(() =>
    alertLevels.value.some((row) => row._dirty),
  );

  function markStageDirty(row: SlaStageConfigRow) {
    row._dirty = true;
  }

  function markAlertDirty(row: SlaAlertLevelConfigRow) {
    row._dirty = true;
  }

  function markChatDirty(row: SlaChatIdleAlertConfigRow) {
    row._dirty = true;
  }

  async function load() {
    loadStatus.value = 'loading';
    try {
      const [stagesPayload, levelsPayload, chatPayload] = await Promise.all([
        api.listStages(),
        api.listAlertLevels(),
        api.listChatIdleAlerts(),
      ]);

      stages.value = stagesPayload.map((s) =>
        cloneStageRow({ ...s, _dirty: false, _isNew: false }),
      );
      alertLevels.value =
        levelsPayload.length > 0
          ? levelsPayload.map((l) => cloneAlertRow({ ...l, _dirty: false, _isNew: false }))
          : SLA_DEFAULT_ALERT_LEVELS.map((seed) => defaultAlertLevel(seed));
      chatAlerts.value = chatPayload.map((c) =>
        cloneChatRow({ ...c, _dirty: false, _isNew: false }),
      );
      loadStatus.value = 'idle';
    } catch (e) {
      console.error(e);
      loadStatus.value = 'error';
      stages.value = [];
      alertLevels.value = SLA_DEFAULT_ALERT_LEVELS.map((seed) =>
        defaultAlertLevel(seed),
      );
      chatAlerts.value = [];
      toast.add({
        title: 'No se pudo cargar la configuración SLA',
        description: getFetchErrorMessage(e),
        color: 'error',
      });
    }
  }

  function addStage(serviceType: RescueServiceType, portal = false) {
    const row = defaultStageForType(serviceType);
    if (portal) {
      row.from_status = SLA_PORTAL_FROM_STATUS;
      row.to_status = 'active_without_quote';
      row.stage_name = 'Toma por gestor';
      row.limit_minutes = 15;
    }
    stages.value.push(row);
  }

  function addAlertLevel() {
    alertLevels.value.push({
      id: null,
      name: 'Nuevo nivel',
      threshold_percent: 80,
      color: '#6366f1',
      is_active: true,
      notify_assigned_manager: true,
      notify_admin: false,
      notify_direction: false,
      _dirty: true,
      _isNew: true,
    });
  }

  function addChatAlert(serviceType: RescueServiceType) {
    chatAlerts.value.push(defaultChatRow(serviceType));
  }

  async function removeStage(row: SlaStageConfigRow) {
    const index = stages.value.indexOf(row);
    if (index < 0) return;

    if (row.id != null) {
      try {
        await api.deleteStage(row.id);
        stages.value.splice(index, 1);
        toast.add({ title: 'Etapa eliminada', color: 'success' });
      } catch (e) {
        console.error(e);
        toast.add({
          title: 'No se pudo eliminar la etapa',
          description: getFetchErrorMessage(e),
          color: 'error',
        });
      }
      return;
    }

    stages.value.splice(index, 1);
  }

  async function removeAlertLevel(row: SlaAlertLevelConfigRow) {
    const index = alertLevels.value.indexOf(row);
    if (index < 0) return;

    if (row.id != null) {
      try {
        await api.deleteAlertLevel(row.id);
        alertLevels.value.splice(index, 1);
        toast.add({ title: 'Nivel eliminado', color: 'success' });
      } catch (e) {
        console.error(e);
        toast.add({
          title: 'No se pudo eliminar el nivel',
          description: getFetchErrorMessage(e),
          color: 'error',
        });
      }
      return;
    }

    alertLevels.value.splice(index, 1);
  }

  async function removeChatAlert(row: SlaChatIdleAlertConfigRow) {
    const index = chatAlerts.value.indexOf(row);
    if (index < 0) return;

    if (row.id != null) {
      try {
        await api.deleteChatIdleAlert(row.id);
        chatAlerts.value.splice(index, 1);
        toast.add({ title: 'Configuración de chat eliminada', color: 'success' });
      } catch (e) {
        console.error(e);
        toast.add({
          title: 'No se pudo eliminar la configuración',
          description: getFetchErrorMessage(e),
          color: 'error',
        });
      }
      return;
    }

    chatAlerts.value.splice(index, 1);
  }

  function validateStages(rows: SlaStageConfigRow[]): string | null {
    for (const row of rows) {
      const result = slaStageRowSchema.safeParse({
        stage_name: row.stage_name,
        from_status: row.from_status,
        to_status: row.to_status,
        limit_minutes: row.limit_minutes,
        is_active: row.is_active,
      });
      if (!result.success) {
        return result.error.issues[0]?.message ?? 'Datos de etapa inválidos';
      }
    }
    return null;
  }

  async function saveStagesForType(serviceType: RescueServiceType) {
    const rows = stagesForType(serviceType, false);
    const error = validateStages(rows);
    if (error) {
      toast.add({ title: error, color: 'warning' });
      return;
    }

    const key = `stages-${serviceType}`;
    setSaving(key, true);
    try {
      await api.saveStagesBatch(
        serviceType,
        rows.map((r) => ({
          id: r.id,
          service_type: r.service_type,
          stage_name: r.stage_name,
          from_status: r.from_status,
          to_status: r.to_status,
          limit_minutes: r.limit_minutes,
          is_active: r.is_active,
        })),
      );
      toast.add({
        title: `Cambios guardados (${getSlaRequestTypeLabel(serviceType)})`,
        color: 'success',
      });
      await load();
    } catch (e) {
      console.error(e);
      toast.add({
        title: 'No se pudieron guardar las etapas',
        description: getFetchErrorMessage(e),
        color: 'error',
      });
    } finally {
      setSaving(key, false);
    }
  }

  async function savePortalStage(row: SlaStageConfigRow) {
    const error = validateStages([row]);
    if (error) {
      toast.add({ title: error, color: 'warning' });
      return;
    }

    const key = `portal-${row.service_type}`;
    setSaving(key, true);
    try {
      await api.saveStagesBatch(row.service_type, [
        {
          id: row.id,
          service_type: row.service_type,
          stage_name: row.stage_name,
          from_status: row.from_status,
          to_status: row.to_status,
          limit_minutes: row.limit_minutes,
          is_active: row.is_active,
        },
      ]);
      toast.add({ title: 'Tiempo de portal guardado', color: 'success' });
      await load();
    } catch (e) {
      console.error(e);
      toast.add({
        title: 'No se pudo guardar',
        description: getFetchErrorMessage(e),
        color: 'error',
      });
    } finally {
      setSaving(key, false);
    }
  }

  async function saveAlertLevels() {
    for (const row of alertLevels.value) {
      const result = slaAlertLevelRowSchema.safeParse({
        name: row.name,
        threshold_percent: row.threshold_percent,
        color: row.color,
        is_active: row.is_active,
        notify_assigned_manager: row.notify_assigned_manager,
        notify_admin: row.notify_admin,
        notify_direction: row.notify_direction,
      });
      if (!result.success) {
        toast.add({
          title: result.error.issues[0]?.message ?? 'Nivel inválido',
          color: 'warning',
        });
        return;
      }
    }

    const key = 'alert-levels';
    setSaving(key, true);
    try {
      await api.saveAlertLevels(
        alertLevels.value.map((r) => ({
          id: r.id,
          name: r.name,
          threshold_percent: r.threshold_percent,
          color: r.color,
          is_active: r.is_active,
          notify_assigned_manager: r.notify_assigned_manager,
          notify_admin: r.notify_admin,
          notify_direction: r.notify_direction,
        })),
      );
      toast.add({ title: 'Niveles de alerta guardados', color: 'success' });
      await load();
    } catch (e) {
      console.error(e);
      toast.add({
        title: 'No se pudieron guardar los niveles',
        description: getFetchErrorMessage(e),
        color: 'error',
      });
    } finally {
      setSaving(key, false);
    }
  }

  async function saveChatForType(serviceType: RescueServiceType) {
    const rows = chatForType(serviceType);
    for (const row of rows) {
      const result = slaChatIdleAlertRowSchema.safeParse({
        operative_status: row.operative_status,
        yellow_limit_minutes: row.yellow_limit_minutes,
        red_limit_minutes: row.red_limit_minutes,
        is_active: row.is_active,
      });
      if (!result.success) {
        toast.add({
          title: result.error.issues[0]?.message ?? 'Configuración inválida',
          color: 'warning',
        });
        return;
      }
    }

    const key = `chat-${serviceType}`;
    setSaving(key, true);
    try {
      await api.saveChatIdleAlertsBatch(
        serviceType,
        rows.map((r) => ({
          id: r.id,
          service_type: r.service_type,
          operative_status: r.operative_status,
          yellow_limit_minutes: r.yellow_limit_minutes,
          red_limit_minutes: r.red_limit_minutes,
          is_active: r.is_active,
        })),
      );
      toast.add({
        title: `Chat guardado (${getSlaRequestTypeLabel(serviceType)})`,
        color: 'success',
      });
      await load();
    } catch (e) {
      console.error(e);
      toast.add({
        title: 'No se pudo guardar la configuración de chat',
        description: getFetchErrorMessage(e),
        color: 'error',
      });
    } finally {
      setSaving(key, false);
    }
  }

  function ensurePortalRows() {
    for (const serviceType of SLA_SERVICE_TYPES) {
      const exists = stages.value.some(
        (row) =>
          row.service_type === serviceType &&
          row.from_status === SLA_PORTAL_FROM_STATUS,
      );
      if (!exists) {
        addStage(serviceType, true);
        const added = stages.value[stages.value.length - 1];
        if (added) added._dirty = false;
      }
    }
  }

  watch(stages, ensurePortalRows, { deep: true, immediate: true });

  return {
    stages,
    alertLevels,
    chatAlerts,
    loadStatus,
    isSaving,
    stagesForType,
    portalStages,
    chatForType,
    hasDirtyStagesForType,
    hasDirtyChatForType,
    hasDirtyAlertLevels,
    markStageDirty,
    markAlertDirty,
    markChatDirty,
    load,
    addStage,
    addAlertLevel,
    addChatAlert,
    removeStage,
    removeAlertLevel,
    removeChatAlert,
    saveStagesForType,
    savePortalStage,
    saveAlertLevels,
    saveChatForType,
  };
}
