import { useMutation, useQueryCache } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import {
  CLIENT_CONTACT_CREATE_PATH,
  CLIENT_CONTACT_DELETE_PATH,
  CLIENT_CONTACT_UPDATE_PATH,
} from '~/constants/client-api';
import type {
  ClientContactCreateBody,
  ClientContactUpdateBody,
} from '~/interfaces/catalogs/client';

export function useClientContactMutations(options: {
  clientId: MaybeRefOrGetter<number | null>;
}) {
  const toast = useToast();
  const queryCache = useQueryCache();
  const clientId = computed(() => toValue(options.clientId));

  async function invalidateContacts() {
    const id = clientId.value;
    if (id == null) return;
    await queryCache.invalidateQueries({ key: ['client-contacts', id] });
  }

  const { mutateAsync: createContactAsync, asyncStatus: createStatus } = useMutation({
    mutation: (body: ClientContactCreateBody) =>
      $fetch(CLIENT_CONTACT_CREATE_PATH, { method: 'POST', body }),
    async onSuccess() {
      toast.add({ title: 'Contacto creado', color: 'success' });
      await invalidateContacts();
    },
    onError: (e) => {
      toast.add({
        title: 'No se pudo crear el contacto',
        description: getFetchErrorMessage(e),
        color: 'error',
      });
    },
  });

  const { mutateAsync: updateContactAsync, asyncStatus: updateStatus } = useMutation({
    mutation: ({
      contactId,
      body,
    }: {
      contactId: number;
      body: ClientContactUpdateBody;
    }) =>
      $fetch(CLIENT_CONTACT_UPDATE_PATH(contactId), {
        method: 'PUT',
        body,
      }),
    async onSuccess() {
      toast.add({ title: 'Contacto actualizado', color: 'success' });
      await invalidateContacts();
    },
    onError: (e) => {
      toast.add({
        title: 'No se pudo actualizar el contacto',
        description: getFetchErrorMessage(e),
        color: 'error',
      });
    },
  });

  const { mutate: removeContact, asyncStatus: removeStatus } = useMutation({
    mutation: (contactId: number) =>
      $fetch(CLIENT_CONTACT_DELETE_PATH(contactId), { method: 'DELETE' }),
    async onSuccess() {
      toast.add({ title: 'Contacto eliminado', color: 'success' });
      await invalidateContacts();
    },
    onError: (e) => {
      toast.add({
        title: 'No se pudo eliminar el contacto',
        description: getFetchErrorMessage(e),
        color: 'error',
      });
    },
  });

  const isSaving = computed(
    () =>
      createStatus.value === 'loading'
      || updateStatus.value === 'loading',
  );

  const isRemoving = computed(() => removeStatus.value === 'loading');

  return {
    createContactAsync,
    updateContactAsync,
    removeContact,
    isSaving,
    isRemoving,
  };
}
