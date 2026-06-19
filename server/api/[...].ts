import { joinURL } from 'ufo';
import { abilityForApiPath } from '~~/shared/utils/admin-api-access';

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const token = session?.token;
  const apiUrl = useRuntimeConfig().apiUrl;

  await authorize(event, abilityForApiPath(event.path));

  const target = joinURL(apiUrl, event.path);

  return proxyRequest(event, target, {
    headers: {
      Authorization: `Token ${token}`,
      'Accept-Language': 'es',
    },
  });
});
