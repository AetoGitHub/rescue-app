import { joinURL } from 'ufo';

export default defineEventHandler(async (event) => {
  const apiUrl = useRuntimeConfig().apiUrl;
  const body = await readBody(event);

  const target = joinURL(apiUrl, '/api/auth/password_reset/request/');

  await $fetch(target, {
    method: 'POST',
    body: {
      identifier: body.identifier,
    },
  });

  return { ok: true };
});
