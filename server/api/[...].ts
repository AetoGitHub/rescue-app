import { joinURL } from 'ufo';

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const token = session?.token;
  const apiUrl = useRuntimeConfig().apiUrl;

  const path = event.path.replace(/^\/api\//, '');

  const target = joinURL(apiUrl, path);

  return proxyRequest(event, target, {
    headers: {
      Authorization: `Token ${token}`,
    },
  });
});
