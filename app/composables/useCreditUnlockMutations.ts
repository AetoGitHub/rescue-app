import { useMutation, useQueryCache } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import {
  creditUnlockCancelPath,
  creditUnlockCreatePath,
} from '~/constants/client-credit-api';
import type {
  CreditTemporaryUnlock,
  CreditUnlockCreateBody,
} from '~/interfaces/catalogs/credit';

async function invalidateUnlockQueries(
  queryCache: ReturnType<typeof useQueryCache>,
  companyId: number | null,
  clientId: number | null,
) {
  if (companyId != null) {
    await queryCache.invalidateQueries({
      key: ['credit-unlock-company', companyId],
    });
  }
  if (clientId != null) {
    await queryCache.invalidateQueries({
      key: ['client-credit', clientId],
    });
  }
}

export function useCreditUnlockMutations(options: {
  companyId: MaybeRefOrGetter<number | null>;
  clientId: MaybeRefOrGetter<number | null>;
}) {
  const apiFetch = useApiFetch();
  const queryCache = useQueryCache();
  const toast = useToast();
  const companyId = computed(() => toValue(options.companyId));
  const clientId = computed(() => toValue(options.clientId));

  const { mutateAsync: createUnlock, asyncStatus: createStatus } = useMutation({
    mutation: (body: CreditUnlockCreateBody) =>
      apiFetch<CreditTemporaryUnlock>(creditUnlockCreatePath(), {
        method: 'POST',
        body,
      }),
    onSuccess: async () => {
      await invalidateUnlockQueries(
        queryCache,
        companyId.value,
        clientId.value,
      );
      toast.add({
        title: 'Extensión de crédito creada',
        color: 'success',
      });
    },
    onError: (error) => {
      toast.add({
        title: 'No se pudo crear la extensión',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
    },
  });

  const { mutateAsync: cancelUnlock, asyncStatus: cancelStatus } = useMutation({
    mutation: (unlockId: number) =>
      apiFetch(creditUnlockCancelPath(unlockId), {
        method: 'POST',
      }),
    onSuccess: async () => {
      await invalidateUnlockQueries(
        queryCache,
        companyId.value,
        clientId.value,
      );
      toast.add({
        title: 'Extensión cancelada',
        color: 'success',
      });
    },
    onError: (error) => {
      toast.add({
        title: 'No se pudo cancelar la extensión',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
    },
  });

  return {
    createUnlock,
    cancelUnlock,
    isCreating: computed(() => createStatus.value === 'loading'),
    isCancelling: computed(() => cancelStatus.value === 'loading'),
  };
}
