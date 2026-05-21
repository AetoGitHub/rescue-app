import type {
  RescueCommissionType,
  RescueCompanySettings,
  RescueContractItem,
} from '~/interfaces/rescue/company-settings';
import type { RescueQuoteLine } from '~/interfaces/rescue';

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseCommissionType(value: unknown): RescueCommissionType {
  return value === 'FIXED' ? 'FIXED' : 'PERCENTAGE';
}

export function mapRescueCompanySettings(
  raw: Record<string, unknown>,
): RescueCompanySettings {
  const commissionsRaw = (raw.commissions ?? {}) as Record<string, unknown>;
  const contractRaw = raw.contract;

  let contract: RescueCompanySettings['contract'] = null;
  if (contractRaw && typeof contractRaw === 'object') {
    const c = contractRaw as Record<string, unknown>;
    const itemsRaw = Array.isArray(c.items) ? c.items : [];
    const mappedItems = itemsRaw.map((item) => {
      const it = item as Record<string, unknown>;
      return {
        id: toNumber(it.id),
        service_id: toNumber(it.service_id),
        service_name: String(it.service_name ?? ''),
        price: toNumber(it.price),
        price_multiplier: toNumber(it.price_multiplier, 1),
        percentaje: toNumber(it.percentaje),
        notes: String(it.notes ?? ''),
      };
    });
    contract = {
      id: toNumber(c.id),
      notes: String(c.notes ?? ''),
      items: dedupeContractItemsByService(mappedItems),
    };
  }

  return {
    commissions: {
      commission_type: parseCommissionType(commissionsRaw.commission_type),
      commission_value: toNumber(commissionsRaw.commission_value),
      commission_fixed: toNumber(commissionsRaw.commission_fixed),
      price_multiplier: toNumber(commissionsRaw.price_multiplier, 1),
    },
    contract,
  };
}

/** Keeps the first contract item per service_id (duplicates are ignored). */
export function dedupeContractItemsByService(
  items: RescueContractItem[],
): RescueContractItem[] {
  const seen = new Set<number>();
  const result: RescueContractItem[] = [];
  for (const item of items) {
    if (seen.has(item.service_id)) continue;
    seen.add(item.service_id);
    result.push(item);
  }
  return result;
}

export function findContractItemForService(
  settings: RescueCompanySettings | null | undefined,
  serviceId: number | null,
): RescueContractItem | undefined {
  if (settings?.contract == null || serviceId == null) return undefined;
  return settings.contract.items.find((item) => item.service_id === serviceId);
}

export function getContractItemById(
  settings: RescueCompanySettings | null | undefined,
  contractItemId: number | null,
): RescueContractItem | undefined {
  if (settings?.contract == null || contractItemId == null) return undefined;
  return settings.contract.items.find((item) => item.id === contractItemId);
}

export function isContractLine(
  line: Pick<RescueQuoteLine, 'contract_item_id'>,
): boolean {
  return line.contract_item_id != null;
}

export function applyContractToLine(
  line: RescueQuoteLine,
  contractItem: RescueContractItem,
): void {
  const alreadyLinked = line.contract_item_id === contractItem.id;
  line.contract_item_id = contractItem.id;
  line.service_id = contractItem.service_id;
  line.service_label = contractItem.service_name;
  if (!alreadyLinked) {
    line.unit_cost = contractItem.price;
  }
}

export function clearContractFromLine(line: RescueQuoteLine): void {
  line.contract_item_id = null;
}
