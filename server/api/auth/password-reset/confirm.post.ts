import { joinURL } from 'ufo';

export default defineEventHandler(async (event) => {
  const apiUrl = useRuntimeConfig().apiUrl;
  const body = await readBody(event);

  const target = joinURL(apiUrl, '/api/auth/password_reset/confirm/');

  try {
    await $fetch(target, {
      method: 'POST',
      body: {
        code: body.code,
        password: body.password,
        password2: body.password2,
      },
    });
  } catch (error) {
    forwardFetchError(error);
  }

  return { ok: true };
});
