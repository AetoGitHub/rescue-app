import { joinURL } from 'ufo';

export default defineEventHandler(async (event) => {
  const apiUrl = useRuntimeConfig().apiUrl;
  const body = await readBody(event);

  const target = joinURL(apiUrl, '/auth/login');

  const response = await $fetch<{ token: string }>(target, {
    method: 'POST',
    body: {
      username: body.username,
      password: body.password,
    },
  });

  await setUserSession(event, {
    user: {
      username: body.username,
    },
    token: response.token,
  });

  return {
    ok: true,
  };
});
