import type { InjectionKey } from 'vue';
import {
  getSlaRequestTypeLabel,
  SLA_ALL_STATUS_OPTIONS,
  SLA_OPERATIONAL_STATUS_OPTIONS,
  SLA_PORTAL_FROM_STATUS,
} from '~/constants/sla-config';
import type { OperationalRescueStatus } from '~/constants/operational-kanban';
import type { RescueServiceType } from '~/interfaces/rescue';
import type {
  SlaLevelAlertConfigRow,
  SlaTimePerStageRow,
  SlaUpdateChatConfigRow,
} from '~/interfaces/sla';
import {
  slaLevelAlertRowSchema,
  slaTimePerStageRowSchema,
  slaUpdateChatRowSchema,
} from '~/schemas/sla-config';

function cloneTimePerStageRow(row: SlaTimePerStageRow): SlaTimePerStageRow {
  return { ...row, _dirty: false, _isNew: false };
}

function cloneLevelAlertRow(row: SlaLevelAlertConfigRow): SlaLevelAlertConfigRow {
  return { ...row, _dirty: false, _isNew: false };
}

function cloneUpdateChatRow(row: SlaUpdateChatConfigRow): SlaUpdateChatConfigRow {
  return { ...row, _dirty: false, _isNew: false };
}

async function persistDirtyRows<T extends { id: number | null; _dirty?: boolean }>(
  rows: T[],
  create: (row: T) => Promise<void>,
  update: (row: T) => Promise<void>,
): Promise<void> {
  for (const row of rows) {
    if (!row._dirty) continue;
    if (row.id == null) {
      await create(row);
    } else {
      await update(row);
    }
  }
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

  const timePerStage = ref<SlaTimePerStageRow[]>([]);
  const levelAlerts = ref<SlaLevelAlertConfigRow[]>([]);
  const updateChatConfigs = ref<SlaUpdateChatConfigRow[]>([]);
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

  function timePerStageForType(
    serviceType: RescueServiceType,
    portalOnly = false,
  ) {
    return timePerStage.value.filter((row) => {
      if (row.service_type !== serviceType) return false;
      if (portalOnly) return row.operative_status === SLA_PORTAL_FROM_STATUS;
      return row.operative_status !== SLA_PORTAL_FROM_STATUS;
    });
  }

  function updateChatForType(serviceType: RescueServiceType) {
    return updateChatConfigs.value.filter(
      (row) => row.service_type === serviceType,
    );
  }

  function usedStatusesForType(
    serviceType: RescueServiceType,
    collection: 'timePerStage' | 'updateChat',
    excludeRow?: SlaTimePerStageRow | SlaUpdateChatConfigRow,
  ): OperationalRescueStatus[] {
    const source =
      collection === 'timePerStage'
        ? timePerStage.value
        : updateChatConfigs.value;
    return source
      .filter((row) => row.service_type === serviceType && row !== excludeRow)
      .map((row) => row.operative_status);
  }

  function firstAvailableStatus(
    serviceType: RescueServiceType,
    collection: 'timePerStage' | 'updateChat',
    options: { label: string; value: OperationalRescueStatus }[],
  ): OperationalRescueStatus | null {
    const used = usedStatusesForType(serviceType, collection);
    const available = options.find((option) => !used.includes(option.value));
    return available?.value ?? null;
  }

  function hasDirtyTimePerStageForType(
    serviceType: RescueServiceType,
    portalOnly = false,
  ) {
    return timePerStageForType(serviceType, portalOnly).some((row) => row._dirty);
  }

  function hasDirtyUpdateChatForType(serviceType: RescueServiceType) {
    return updateChatForType(serviceType).some((row) => row._dirty);
  }

  const hasDirtyLevelAlerts = computed(() =>
    levelAlerts.value.some((row) => row._dirty),
  );

  function markTimePerStageDirty(row: SlaTimePerStageRow) {
    row._dirty = true;
  }

  function markLevelAlertDirty(row: SlaLevelAlertConfigRow) {
    row._dirty = true;
  }

  function markUpdateChatDirty(row: SlaUpdateChatConfigRow) {
    row._dirty = true;
  }

  async function load() {
    loadStatus.value = 'loading';
    try {
      const [stagesPayload, levelsPayload, chatPayload] = await Promise.all([
        api.listTimePerStage(),
        api.listLevelAlert(),
        api.listUpdateChat(),
      ]);

      timePerStage.value = stagesPayload.map((row) =>
        cloneTimePerStageRow({ ...row, _dirty: false, _isNew: false }),
      );
      levelAlerts.value = levelsPayload.map((row) =>
        cloneLevelAlertRow({ ...row, _dirty: false, _isNew: false }),
      );
      updateChatConfigs.value = chatPayload.map((row) =>
        cloneUpdateChatRow({ ...row, _dirty: false, _isNew: false }),
      );
      loadStatus.value = 'idle';
    } catch (e) {
      console.error(e);
      loadStatus.value = 'error';
      timePerStage.value = [];
      levelAlerts.value = [];
      updateChatConfigs.value = [];
      toast.add({
        title: 'No se pudo cargar la configuración SLA',
        description: getFetchErrorMessage(e),
        color: 'error',
      });
    }
  }

  function addTimePerStage(serviceType: RescueServiceType, portal = false) {
    const options = portal
      ? SLA_ALL_STATUS_OPTIONS.filter((o) => o.value === SLA_PORTAL_FROM_STATUS)
      : SLA_ALL_STATUS_OPTIONS.filter((o) => o.value !== SLA_PORTAL_FROM_STATUS);
    const status = firstAvailableStatus(serviceType, 'timePerStage', options);
    if (!status) return;

    timePerStage.value.push({
      id: null,
      service_type: serviceType,
      operative_status: status,
      time: portal ? 10 : 60,
      unit: portal ? 'minutes' : 'hours',
      _dirty: true,
      _isNew: true,
    });
  }

  function addLevelAlert() {
    levelAlerts.value.push({
      id: null,
      name: 'Nuevo nivel',
      percentage_limit: 80,
      color: '#6366f1',
      notify_gestor: true,
      notify_admin: false,
      notify_direccion: false,
      _dirty: true,
      _isNew: true,
    });
  }

  function addUpdateChat(serviceType: RescueServiceType) {
    const status = firstAvailableStatus(
      serviceType,
      'updateChat',
      SLA_OPERATIONAL_STATUS_OPTIONS,
    );
    if (!status) return;

    updateChatConfigs.value.push({
      id: null,
      service_type: serviceType,
      operative_status: status,
      yellow_time: 30,
      yellow_unit: 'minutes',
      red_time: 1,
      red_unit: 'hours',
      _dirty: true,
      _isNew: true,
    });
  }

  function validateTimePerStageRows(rows: SlaTimePerStageRow[]): string | null {
    for (const row of rows) {
      const result = slaTimePerStageRowSchema.safeParse({
        operative_status: row.operative_status,
        time: row.time,
        unit: row.unit,
      });
      if (!result.success) {
        return result.error.issues[0]?.message ?? 'Datos inválidos';
      }
    }
    return null;
  }

  async function saveDirtyTimePerStageRows(rows: SlaTimePerStageRow[]) {
    const dirtyRows = rows.filter((row) => row._dirty);
    if (dirtyRows.length === 0) return;

    const error = validateTimePerStageRows(dirtyRows);
    if (error) {
      toast.add({ title: error, color: 'warning' });
      throw new Error('validation');
    }

    await persistDirtyRows(
      dirtyRows,
      async (row) => {
        await api.createTimePerStage({
          service_type: row.service_type,
          operative_status: row.operative_status,
          time: row.time,
          unit: row.unit,
        });
      },
      async (row) => {
        await api.updateTimePerStage(row.id!, {
          service_type: row.service_type,
          operative_status: row.operative_status,
          time: row.time,
          unit: row.unit,
        });
      },
    );
  }

  async function saveTimePerStageForType(serviceType: RescueServiceType) {
    const key = `stages-${serviceType}`;
    setSaving(key, true);
    try {
      await saveDirtyTimePerStageRows(timePerStageForType(serviceType, false));
      toast.add({
        title: `Cambios guardados (${getSlaRequestTypeLabel(serviceType)})`,
        color: 'success',
      });
      await load();
    } catch (e) {
      if (!(e instanceof Error && e.message === 'validation')) {
        console.error(e);
        toast.add({
          title: 'No se pudieron guardar las etapas',
          description: getFetchErrorMessage(e),
          color: 'error',
        });
      }
    } finally {
      setSaving(key, false);
    }
  }

  async function savePortalTimePerStage(row: SlaTimePerStageRow) {
    const key = `portal-${row.service_type}`;
    setSaving(key, true);
    try {
      await saveDirtyTimePerStageRows([row]);
      toast.add({ title: 'Tiempo de portal guardado', color: 'success' });
      await load();
    } catch (e) {
      if (!(e instanceof Error && e.message === 'validation')) {
        console.error(e);
        toast.add({
          title: 'No se pudo guardar',
          description: getFetchErrorMessage(e),
          color: 'error',
        });
      }
    } finally {
      setSaving(key, false);
    }
  }

  async function saveLevelAlerts() {
    const dirtyRows = levelAlerts.value.filter((row) => row._dirty);
    if (dirtyRows.length === 0) return;

    for (const row of dirtyRows) {
      const result = slaLevelAlertRowSchema.safeParse({
        name: row.name,
        percentage_limit: row.percentage_limit,
        color: row.color,
        notify_gestor: row.notify_gestor,
        notify_admin: row.notify_admin,
        notify_direccion: row.notify_direccion,
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
      await persistDirtyRows(
        dirtyRows,
        async (row) => {
          await api.createLevelAlert({
            name: row.name,
            percentage_limit: row.percentage_limit,
            color: row.color,
            notify_gestor: row.notify_gestor,
            notify_admin: row.notify_admin,
            notify_direccion: row.notify_direccion,
          });
        },
        async (row) => {
          await api.updateLevelAlert(row.id!, {
            name: row.name,
            percentage_limit: row.percentage_limit,
            color: row.color,
            notify_gestor: row.notify_gestor,
            notify_admin: row.notify_admin,
            notify_direccion: row.notify_direccion,
          });
        },
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

  async function saveUpdateChatForType(serviceType: RescueServiceType) {
    const dirtyRows = updateChatForType(serviceType).filter((row) => row._dirty);
    if (dirtyRows.length === 0) return;

    for (const row of dirtyRows) {
      const result = slaUpdateChatRowSchema.safeParse({
        operative_status: row.operative_status,
        yellow_time: row.yellow_time,
        yellow_unit: row.yellow_unit,
        red_time: row.red_time,
        red_unit: row.red_unit,
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
      await persistDirtyRows(
        dirtyRows,
        async (row) => {
          await api.createUpdateChat({
            service_type: row.service_type,
            operative_status: row.operative_status,
            yellow_time: row.yellow_time,
            yellow_unit: row.yellow_unit,
            red_time: row.red_time,
            red_unit: row.red_unit,
          });
        },
        async (row) => {
          await api.updateUpdateChat(row.id!, {
            service_type: row.service_type,
            operative_status: row.operative_status,
            yellow_time: row.yellow_time,
            yellow_unit: row.yellow_unit,
            red_time: row.red_time,
            red_unit: row.red_unit,
          });
        },
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

  function canAddTimePerStage(serviceType: RescueServiceType, portal = false) {
    const options = portal
      ? SLA_ALL_STATUS_OPTIONS.filter((o) => o.value === SLA_PORTAL_FROM_STATUS)
      : SLA_ALL_STATUS_OPTIONS.filter((o) => o.value !== SLA_PORTAL_FROM_STATUS);
    return firstAvailableStatus(serviceType, 'timePerStage', options) != null;
  }

  function canAddUpdateChat(serviceType: RescueServiceType) {
    return (
      firstAvailableStatus(
        serviceType,
        'updateChat',
        SLA_OPERATIONAL_STATUS_OPTIONS,
      ) != null
    );
  }

  return {
    timePerStage,
    levelAlerts,
    updateChatConfigs,
    loadStatus,
    isSaving,
    timePerStageForType,
    updateChatForType,
    usedStatusesForType,
    hasDirtyTimePerStageForType,
    hasDirtyUpdateChatForType,
    hasDirtyLevelAlerts,
    markTimePerStageDirty,
    markLevelAlertDirty,
    markUpdateChatDirty,
    load,
    addTimePerStage,
    addLevelAlert,
    addUpdateChat,
    saveTimePerStageForType,
    savePortalTimePerStage,
    saveLevelAlerts,
    saveUpdateChatForType,
    canAddTimePerStage,
    canAddUpdateChat,
  };
}
