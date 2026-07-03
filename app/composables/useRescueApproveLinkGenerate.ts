import type { MaybeRefOrGetter } from 'vue';
import { RESCUE_APPROVE_LINK_GENERATE_PATH } from '~/constants/rescue-approve-link-api';
import type { RescueApproveLinkGenerateResponse } from '~/interfaces/rescue/approve-link';
import {
  buildGuestAuthorizationUrl,
  extractApproveTokenFromGenerateResponse,
} from '~/utils/rescue-approve-link';

export function useRescueApproveLinkGenerate(
  rescueId: MaybeRefOrGetter<number | null>,
) {
  const apiFetch = useApiFetch();
  const toast = useToast();
  const requestUrl = useRequestURL();
  const lastUrl = ref('');
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

  async function generateLink(): Promise<string | null> {
    const currentId = id.value;
    if (currentId == null) return null;

    isGenerating.value = true;
    try {
      const response = await apiFetch<RescueApproveLinkGenerateResponse>(
        RESCUE_APPROVE_LINK_GENERATE_PATH(currentId),
        {
          method: 'POST',
          body: {},
        },
      );

      const token = extractApproveTokenFromGenerateResponse(response);
      if (!token) {
        toast.add({
          title: 'No se pudo generar el link',
          description: 'La respuesta del servidor no incluyó un token válido.',
          color: 'error',
        });
        return null;
      }

      const url = buildGuestAuthorizationUrl(
        currentId,
        token,
        authorizationOrigin(),
      );
      lastUrl.value = url;
      await copyAuthorizationUrl(url);

      return url;
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

  async function copyLastUrl(): Promise<boolean> {
    if (!lastUrl.value.trim()) return false;
    return copyAuthorizationUrl(lastUrl.value);
  }

  return {
    generateLink,
    copyLastUrl,
    lastUrl: computed(() => lastUrl.value),
    isGenerating: computed(() => isGenerating.value),
  };
}
