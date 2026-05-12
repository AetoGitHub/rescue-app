import type { InputNumberProps } from '@nuxt/ui';
import type { Ref } from 'vue';

export const CATALOG_NUMBER_LOCALE = 'es-MX';
export const CATALOG_CURRENCY = 'MXN';

export type CatalogCommissionType = 'PERCENTAGE' | 'FIXED';

export function normalizeCatalogName(value: string): string {
  return value.trim().toUpperCase();
}

export function formatCatalogNameInput(
  value: string | number | undefined,
): string {
  return String(value ?? '').toUpperCase();
}

type StringNumberModelOptions = {
  decimals?: number;
  emptyValue?: string;
};

function formatStringNumber(value: number, decimals: number): string {
  if (!Number.isFinite(value)) return '';
  if (decimals === 0) return String(Math.trunc(value));
  return value.toFixed(decimals);
}

function parseStringNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const parsed = Number(trimmed.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function useStringNumberModel(
  source: Ref<string>,
  options: StringNumberModelOptions = {},
) {
  const decimals = options.decimals ?? 2;
  const emptyValue = options.emptyValue ?? '';

  return computed({
    get: () => parseStringNumber(source.value),
    set: (value: number | undefined) => {
      source.value =
        value == null || Number.isNaN(value)
          ? emptyValue
          : formatStringNumber(value, decimals);
    },
  });
}

export function usePercentStringNumberModel(
  source: Ref<string>,
  options: StringNumberModelOptions = {},
) {
  const decimals = options.decimals ?? 2;
  const emptyValue = options.emptyValue ?? '';

  return computed({
    get: () => {
      const parsed = parseStringNumber(source.value);
      if (parsed == null) return undefined;
      return parsed / 100;
    },
    set: (value: number | undefined) => {
      source.value =
        value == null || Number.isNaN(value)
          ? emptyValue
          : formatStringNumber(value * 100, decimals);
    },
  });
}

export function useCommissionValueModel(
  source: Ref<string>,
  commissionType: Ref<CatalogCommissionType>,
) {
  return computed({
    get: () => {
      const parsed = parseStringNumber(source.value);
      if (parsed == null) return undefined;
      return commissionType.value === 'PERCENTAGE' ? parsed / 100 : parsed;
    },
    set: (value: number | undefined) => {
      if (value == null || Number.isNaN(value)) {
        source.value = '';
        return;
      }
      source.value =
        commissionType.value === 'PERCENTAGE'
          ? formatStringNumber(value * 100, 2)
          : formatStringNumber(value, 2);
    },
  });
}

export function useOptionalIntegerModel(source: Ref<number | undefined>) {
  return computed({
    get: () => source.value,
    set: (value: number | undefined) => {
      source.value =
        value == null || Number.isNaN(value) ? undefined : Math.trunc(value);
    },
  });
}

export function useRequiredIntegerModel(source: Ref<number>) {
  return computed({
    get: () => source.value,
    set: (value: number | undefined) => {
      source.value =
        value == null || Number.isNaN(value) ? 0 : Math.trunc(value);
    },
  });
}

const catalogInputNumberBase = {
  variant: 'subtle' as const,
  class: 'w-full',
  increment: false,
  decrement: false,
};

export const catalogCurrencyInputProps: InputNumberProps = {
  ...catalogInputNumberBase,
  step: 0.01,
  formatOptions: {
    style: 'currency',
    currency: CATALOG_CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    currencyDisplay: 'narrowSymbol',
  },
};

export const catalogPercentInputProps: InputNumberProps = {
  ...catalogInputNumberBase,
  step: 0.01,
  formatOptions: {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  },
};

export const catalogNumberInputProps: InputNumberProps = {
  ...catalogInputNumberBase,
  step: 0.01,
  formatOptions: {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  },
};

export const catalogIntegerInputProps: InputNumberProps = {
  ...catalogInputNumberBase,
  step: 1,
  formatOptions: {
    style: 'decimal',
    maximumFractionDigits: 0,
  },
};

export const catalogCoordinateInputProps: InputNumberProps = {
  ...catalogInputNumberBase,
  step: 0.000001,
  formatOptions: {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  },
};

/** @deprecated Use catalogNumberInputProps */
export const catalogDecimalInputProps = catalogNumberInputProps;

export function catalogCommissionValueInputProps(
  commissionType: CatalogCommissionType,
) {
  return commissionType === 'PERCENTAGE'
    ? catalogPercentInputProps
    : catalogCurrencyInputProps;
}
