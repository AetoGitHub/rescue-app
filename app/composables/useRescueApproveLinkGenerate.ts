import type { MaybeRefOrGetter } from 'vue';
import { RESCUE_APPROVE_LINK_GENERATE_PATH } from '~/constants/rescue-approve-link-api';
import type {
  RescueApproveLinkGenerated,
  RescueApproveLinkGenerateResponse,
} from '~/interfaces/rescue/approve-link';
import {
  mapApproveLinkGenerateItems,
} from '~/utils/rescue-approve-link';

export function useRescueApproveLinkGenerate(
  rescueId: MaybeRefOrGetter<number | null>,
) {
  const apiFetch = useApiFetch();
  const toast = useToast();
  const requestUrl = useRequestURL();
  const lastLinks = ref<RescueApproveLinkGenerated[]>([]);
  const isGenerating = ref(false);

  const id = computed(() => toValue(rescueId));

  function authorizationOrigin(): string {
    if (import.meta.client && typeof window !== 'undefined') {
      return window.location.origin;
    }
    return requestUrl.origin;
  }

  async function copyAuthorizationUrl(url: string): Promise<boolean> {
    const copied = await copyTextToClipboard(url);
    toast.add({
      title: copied ? 'Link copiado' : 'No se pudo copiar el link',
      description: copied
        ? 'El enlace de autorización se copió al portapapeles.'
        : url,
      color: copied ? 'success' : 'warning',
    });
    return copied;
  }

  async function generateLink(
    ids: number[],
  ): Promise<RescueApproveLinkGenerated[] | null> {
    if (isGenerating.value) return null;

    const currentId = id.value;
    if (currentId == null) return null;
    if (ids.length === 0) return null;

    isGenerating.value = true;
    try {
      const response = await apiFetch<RescueApproveLinkGenerateResponse>(
        RESCUE_APPROVE_LINK_GENERATE_PATH(currentId),
        {
          method: 'POST',
          body: { ids },
        },
      );

      const links = mapApproveLinkGenerateItems(
        currentId,
        response,
        authorizationOrigin(),
      );

      if (links.length === 0) {
        toast.add({
          title: 'No se pudo generar el link',
          description:
            'Ningún autorizador válido recibió un link. Revisa la selección.',
          color: 'error',
        });
        lastLinks.value = [];
        return null;
      }

      lastLinks.value = links;
      await copyAuthorizationUrl(links[0]!.url);

      return links;
    } catch (error) {
      toast.add({
        title: 'No se pudo generar el link',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
      return null;
    } finally {
      isGenerating.value = false;
    }
  }

  async function copyLinkUrl(url: string): Promise<boolean> {
    if (!url.trim()) return false;
    return copyAuthorizationUrl(url);
  }

  return {
    generateLink,
    copyLinkUrl,
    lastLinks: computed(() => lastLinks.value),
    isGenerating: computed(() => isGenerating.value),
  };
}
