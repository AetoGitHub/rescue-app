import { parsePositiveIntQuery } from '#shared/utils/payment-balance-query';

const STORAGE_KEY = 'payment-cart-test-days';

function readStoredTestDays(): number | null {
  if (!import.meta.client) return null;

  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw == null) return null;

  return parsePositiveIntQuery(raw);
}

function writeStoredTestDays(value: number | null) {
  if (!import.meta.client) return;

  if (value == null) {
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }

  sessionStorage.setItem(STORAGE_KEY, String(value));
}

export function usePaymentCartTestDays() {
  const appliedTestDays = useState<number | null>(
    'payment-cart-test-days',
    () => (import.meta.dev ? readStoredTestDays() : null),
  );

  const testDaysInput = ref<number | null>(appliedTestDays.value);

  function applyTestDaysSimulation() {
    if (!import.meta.dev) return;

    const parsed = parsePositiveIntQuery(
      testDaysInput.value?.toString().trim(),
    );
    appliedTestDays.value = parsed;
    writeStoredTestDays(parsed);
  }

  function clearTestDaysSimulation() {
    if (!import.meta.dev) return;

    testDaysInput.value = null;
    appliedTestDays.value = null;
    writeStoredTestDays(null);
  }

  onMounted(() => {
    if (!import.meta.dev) return;

    const stored = readStoredTestDays();
    if (stored != null) {
      appliedTestDays.value = stored;
      testDaysInput.value = stored;
    }
  });

  return {
    testDaysInput,
    appliedTestDays,
    applyTestDaysSimulation,
    clearTestDaysSimulation,
  };
}
