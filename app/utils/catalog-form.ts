import type { Ref } from 'vue';

export function normalizeCatalogName(value: string): string {
  return value.trim().toUpperCase();
}

export function formatCatalogNameInput(value: string | number | undefined): string {
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

export function useOptionalIntegerModel(source: Ref<number | undefined>) {
  return computed({
    get: () => source.value,
    set: (value: number | undefined) => {
      source.value =
        value == null || Number.isNaN(value) ? undefined : Math.trunc(value);
    },
  });
}

export const catalogDecimalInputProps = {
  variant: 'subtle' as const,
  class: 'w-full',
  step: 0.01,
  formatOptions: {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  },
};

export const catalogCoordinateInputProps = {
  variant: 'subtle' as const,
  class: 'w-full',
  step: 0.000001,
  formatOptions: {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  },
};

export const catalogIntegerInputProps = {
  variant: 'subtle' as const,
  class: 'w-full',
  step: 1,
  formatOptions: {
    maximumFractionDigits: 0,
  },
};
