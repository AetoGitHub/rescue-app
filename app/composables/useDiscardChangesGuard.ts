interface UseDiscardChangesGuardOptions {
  open: Ref<boolean>;
  snapshot: () => unknown;
  alwaysConfirm?: MaybeRefOrGetter<boolean>;
}

function serializeDiscardSnapshot(value: unknown): string {
  return JSON.stringify(toRaw(value));
}

export function useDiscardChangesGuard(options: UseDiscardChangesGuardOptions) {
  const discardConfirmOpen = ref(false);
  const dirtySnapshot = ref(serializeDiscardSnapshot(options.snapshot()));
  let bypassConfirmation = false;

  const hasUnsavedChanges = computed(() => {
    if (!options.open.value) return false;
    if (toValue(options.alwaysConfirm) === true) return true;
    return serializeDiscardSnapshot(options.snapshot()) !== dirtySnapshot.value;
  });

  function resetDirtySnapshot() {
    dirtySnapshot.value = serializeDiscardSnapshot(options.snapshot());
  }

  function closeWithoutConfirm() {
    discardConfirmOpen.value = false;
    bypassConfirmation = true;
    options.open.value = false;
    nextTick(() => {
      bypassConfirmation = false;
    });
  }

  function requestClose() {
    if (!options.open.value) return;
    if (bypassConfirmation || !hasUnsavedChanges.value) {
      closeWithoutConfirm();
      return;
    }
    discardConfirmOpen.value = true;
  }

  function confirmDiscard() {
    closeWithoutConfirm();
  }

  function cancelDiscard() {
    discardConfirmOpen.value = false;
  }

  const guardedOpen = computed({
    get: () => options.open.value,
    set: (value: boolean) => {
      if (value) {
        options.open.value = true;
        return;
      }
      requestClose();
    },
  });

  return {
    guardedOpen,
    discardConfirmOpen,
    hasUnsavedChanges,
    requestClose,
    confirmDiscard,
    cancelDiscard,
    resetDirtySnapshot,
    closeWithoutConfirm,
  };
}
