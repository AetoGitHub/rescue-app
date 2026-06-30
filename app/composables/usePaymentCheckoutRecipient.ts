import type { PaymentCheckoutRecipient } from '~/interfaces/payment/checkout-recipient';
import type { PaymentListFilterInput } from '~/utils/payment-list-query';

const STORAGE_KEY = 'payment-checkout-recipient';

function readStoredRecipient(): PaymentCheckoutRecipient | null {
  if (!import.meta.client) return null;

  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PaymentCheckoutRecipient;
    if (
      (parsed.type === 'operative' || parsed.type === 'seller')
      && typeof parsed.userId === 'number'
      && Number.isFinite(parsed.userId)
    ) {
      return {
        type: parsed.type,
        userId: parsed.userId,
        userName:
          typeof parsed.userName === 'string' && parsed.userName.trim()
            ? parsed.userName.trim()
            : null,
      };
    }
  } catch {
    // Ignore invalid persisted state.
  }

  return null;
}

function writeStoredRecipient(recipient: PaymentCheckoutRecipient | null) {
  if (!import.meta.client) return;

  if (recipient == null) {
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(recipient));
}

export function usePaymentCheckoutRecipient() {
  const recipient = useState<PaymentCheckoutRecipient | null>(
    'payment-checkout-recipient',
    () => readStoredRecipient(),
  );

  function setRecipient(next: PaymentCheckoutRecipient) {
    recipient.value = {
      type: next.type,
      userId: next.userId,
      userName: next.userName?.trim() || null,
    };
    writeStoredRecipient(recipient.value);
  }

  function clearRecipient() {
    recipient.value = null;
    writeStoredRecipient(null);
  }

  function syncRecipientUserName(userName: string | null | undefined) {
    if (recipient.value == null) return;

    const normalized = userName?.trim();
    if (!normalized || recipient.value.userName === normalized) return;

    setRecipient({
      ...recipient.value,
      userName: normalized,
    });
  }

  onMounted(() => {
    const stored = readStoredRecipient();
    if (stored != null) {
      recipient.value = stored;
    }
  });

  return {
    recipient,
    setRecipient,
    clearRecipient,
    syncRecipientUserName,
  };
}

export function paymentCheckoutRecipientFromFilters(
  filters: PaymentListFilterInput,
  userName?: string | null,
): PaymentCheckoutRecipient | null {
  if (filters.userId == null) return null;

  return {
    type: filters.type,
    userId: filters.userId,
    userName: userName?.trim() || null,
  };
}
