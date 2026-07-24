<script setup lang="ts">
/**
 * Number input that commits on every keystroke so quote pricing
 * recomputes while typing. UInputNumber (Reka NumberField) only
 * applies the model on blur/Enter, which blocks live totals.
 */
const model = defineModel<number>({ required: true });

const props = withDefaults(
  defineProps<{
    min?: number;
    integer?: boolean;
    decimals?: number;
  }>(),
  {
    min: 0,
    integer: false,
    decimals: 2,
  },
);

const focused = ref(false);
const display = ref(formatDisplay(model.value));

function formatDisplay(value: number): string {
  if (!Number.isFinite(value)) return '';
  if (props.integer) return String(Math.trunc(value));
  return String(Number(value.toFixed(props.decimals)));
}

function clampValue(value: number): number {
  if (props.min != null && value < props.min) return props.min;
  return value;
}

function parseLive(raw: string): number | undefined {
  const trimmed = raw.trim().replace(/,/g, '');
  if (trimmed === '' || trimmed === '-' || trimmed === '.') return undefined;

  const withoutTrailingDot = trimmed.endsWith('.')
    ? trimmed.slice(0, -1)
    : trimmed;
  if (withoutTrailingDot === '' || withoutTrailingDot === '-') return undefined;

  const parsed = Number(withoutTrailingDot);
  if (!Number.isFinite(parsed)) return undefined;
  return props.integer ? Math.trunc(parsed) : parsed;
}

function onUpdate(raw: string | number | undefined) {
  const text = String(raw ?? '');
  display.value = text;

  if (text.trim() === '') {
    model.value = clampValue(0);
    return;
  }

  const parsed = parseLive(text);
  if (parsed == null) return;
  model.value = clampValue(parsed);
}

function onFocus() {
  focused.value = true;
}

function onBlur() {
  focused.value = false;
  display.value = formatDisplay(model.value);
}

watch(
  () => model.value,
  (value) => {
    if (focused.value) return;
    display.value = formatDisplay(value);
  },
);
</script>

<template>
  <UInput
    :model-value="display"
    type="text"
    :inputmode="integer ? 'numeric' : 'decimal'"
    autocomplete="off"
    class="w-full"
    variant="subtle"
    @update:model-value="onUpdate"
    @focus="onFocus"
    @blur="onBlur"
  />
</template>
