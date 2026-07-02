import { QUOTE_DEV_UNLOCK_COPY } from '~/constants/quote-pricing';
import { isAdminRole } from '#shared/utils/auth-roles';
import {
  canToggleQuotePricingDevUnlock,
  isQuoteDevUnlockShortcut,
  quotePricingDevBreakdownMode,
  readQuoteDevUnlockFromSessionStorage,
  shouldShowQuotePricingDevBreakdown,
  writeQuoteDevUnlockToStorage,
} from '~/utils/quote-pricing-dev-unlock';

let shortcutListenerCount = 0;
let shortcutHandler: ((event: KeyboardEvent) => void) | null = null;

export function useQuotePricingDevUnlock() {
  const { user } = useUserSession();
  const toast = useToast();

  const unlocked = useState<boolean>('quote-pricing-dev-unlocked', () => false);

  const isAdmin = computed(() => isAdminRole(user.value?.role));

  const canUnlock = computed(() =>
    canToggleQuotePricingDevUnlock({
      dev: import.meta.dev,
      isAdmin: isAdmin.value,
    }),
  );

  const showBreakdown = computed(() =>
    shouldShowQuotePricingDevBreakdown({
      dev: import.meta.dev,
      unlocked: unlocked.value,
      isAdmin: isAdmin.value,
    }),
  );

  const breakdownMode = computed(() =>
    quotePricingDevBreakdownMode({
      dev: import.meta.dev,
      unlocked: unlocked.value,
      isAdmin: isAdmin.value,
    }),
  );

  function syncUnlockedFromStorage() {
    if (import.meta.dev) {
      unlocked.value = true;
      return;
    }

    unlocked.value = readQuoteDevUnlockFromSessionStorage();
  }

  function toggleUnlock() {
    if (!canUnlock.value) return;

    if (import.meta.dev) {
      unlocked.value = true;
      return;
    }

    unlocked.value = !unlocked.value;
    writeQuoteDevUnlockToStorage(unlocked.value);

    toast.add({
      title: unlocked.value
        ? QUOTE_DEV_UNLOCK_COPY.enabled
        : QUOTE_DEV_UNLOCK_COPY.disabled,
      color: unlocked.value ? 'success' : 'neutral',
    });
  }

  function onShortcutKeydown(event: KeyboardEvent) {
    if (!isQuoteDevUnlockShortcut(event)) return;
    if (!canUnlock.value) return;

    event.preventDefault();
    toggleUnlock();
  }

  function registerShortcut() {
    if (!import.meta.client) return;

    shortcutListenerCount += 1;
    if (shortcutListenerCount > 1) return;

    shortcutHandler = onShortcutKeydown;
    window.addEventListener('keydown', shortcutHandler);
  }

  function unregisterShortcut() {
    if (!import.meta.client || shortcutHandler == null) return;

    shortcutListenerCount = Math.max(0, shortcutListenerCount - 1);
    if (shortcutListenerCount > 0) return;

    window.removeEventListener('keydown', shortcutHandler);
    shortcutHandler = null;
  }

  onMounted(() => {
    syncUnlockedFromStorage();
  });

  return {
    unlocked,
    canUnlock,
    showBreakdown,
    breakdownMode,
    toggleUnlock,
    registerShortcut,
    unregisterShortcut,
    syncUnlockedFromStorage,
  };
}
