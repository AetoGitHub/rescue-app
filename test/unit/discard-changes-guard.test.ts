import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { computed, nextTick, reactive, ref, toRaw, toValue } from 'vue';
import { useDiscardChangesGuard } from '~/composables/useDiscardChangesGuard';

describe('useDiscardChangesGuard', () => {
  beforeAll(() => {
    vi.stubGlobal('computed', computed);
    vi.stubGlobal('nextTick', nextTick);
    vi.stubGlobal('ref', ref);
    vi.stubGlobal('toRaw', toRaw);
    vi.stubGlobal('toValue', toValue);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('closes without confirmation when the snapshot is unchanged', async () => {
    const open = ref(true);
    const state = reactive({ name: '' });
    const guard = useDiscardChangesGuard({ open, snapshot: () => state });

    guard.resetDirtySnapshot();
    guard.requestClose();
    await nextTick();

    expect(open.value).toBe(false);
    expect(guard.discardConfirmOpen.value).toBe(false);
  });

  it('asks for confirmation when the snapshot changed', () => {
    const open = ref(true);
    const state = reactive({ name: '' });
    const guard = useDiscardChangesGuard({ open, snapshot: () => state });

    guard.resetDirtySnapshot();
    state.name = 'Cliente';
    guard.requestClose();

    expect(open.value).toBe(true);
    expect(guard.discardConfirmOpen.value).toBe(true);
  });

  it('can always ask for confirmation even without changes', () => {
    const open = ref(true);
    const state = reactive({ name: '' });
    const guard = useDiscardChangesGuard({
      open,
      snapshot: () => state,
      alwaysConfirm: true,
    });

    guard.resetDirtySnapshot();
    guard.requestClose();

    expect(open.value).toBe(true);
    expect(guard.discardConfirmOpen.value).toBe(true);
  });
});
