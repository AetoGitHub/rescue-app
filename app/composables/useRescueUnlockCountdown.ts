import { useNow } from '@vueuse/core';
import type { MaybeRefOrGetter } from 'vue';

export function useRescueUnlockCountdown(
  unlockedUntil: MaybeRefOrGetter<string | null | undefined>,
) {
  const until = computed(() => toValue(unlockedUntil));

  const now = useNow({ interval: 1000 });

  const remainingMs = computed(() =>
    getRescueUnlockRemainingMs(until.value, now.value.getTime()),
  );

  const isActive = computed(() => remainingMs.value > 0);

  const isExpired = computed(
    () => Boolean(until.value?.trim()) && remainingMs.value <= 0,
  );

  const remainingLabel = computed(() =>
    formatRescueUnlockRemaining(until.value, now.value.getTime()),
  );

  return {
    isActive,
    isExpired,
    remainingMs,
    remainingLabel,
  };
}
