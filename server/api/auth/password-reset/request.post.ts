import { joinURL } from 'ufo';

export default defineEventHandler(async (event) => {
  const apiUrl = useRuntimeConfig().apiUrl;
  const body = await readBody(event);

  const target = joinURL(apiUrl, '/api/auth/password_reset/request/');

  try {
    await $fetch(target, {
      method: 'POST',
      body: {
        identifier: body.identifier,
      },
    });
  } catch (error) {
    forwardFetchError(error);
  }

  return { ok: true };
});
