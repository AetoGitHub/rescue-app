import { joinURL } from 'ufo';

export default defineEventHandler(async (event) => {
  const apiUrl = useRuntimeConfig().apiUrl;
  const body = await readBody(event);

  const target = joinURL(apiUrl, '/api/auth/password_reset/confirm/');

  await $fetch(target, {
    method: 'POST',
    body: {
      code: body.code,
      password: body.password,
      password2: body.password2,
    },
  });

  return { ok: true };
});
