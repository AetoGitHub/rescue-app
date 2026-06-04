import type { MaybeRefOrGetter } from 'vue';

export function useRescueUnlockEditSession(
  unlockedUntil: MaybeRefOrGetter<string | null | undefined>,
  sessionOpen: MaybeRefOrGetter<boolean>,
) {
  const capturedUntil = ref<string | null>(null);

  watch(
    [() => toValue(sessionOpen), () => toValue(unlockedUntil)],
    ([isOpen, until]) => {
      if (!isOpen) {
        capturedUntil.value = null;
        return;
      }

      if (isRescueUnlockActive(until)) {
        capturedUntil.value = until ?? null;
      }
    },
    { immediate: true },
  );

  const hasEditSession = computed(() => capturedUntil.value != null);

  return {
    capturedUntil: readonly(capturedUntil),
    hasEditSession,
  };
}
