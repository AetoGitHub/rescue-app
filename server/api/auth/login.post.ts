import { joinURL } from 'ufo';
import { SESSION_MAX_AGE } from '#shared/constants/session';
import { normalizeAuthUserRoleForSession } from '#shared/utils/auth-roles';

interface Response {
  token: string;
  id: number;
  role: string;
  name: string;
}

export default defineEventHandler(async (event) => {
  const apiUrl = useRuntimeConfig().apiUrl;
  const body = await readBody(event);

  const target = joinURL(apiUrl, '/api/auth/login/');

  const response = await $fetch<Response>(target, {
    method: 'POST',
    body: {
      username: body.username,
      password: body.password,
    },
  });

  await setUserSession(
    event,
    {
      user: {
        name: response.name,
        id: response.id,
        role: normalizeAuthUserRoleForSession(response.role),
      },
      token: response.token,
    },
    { maxAge: SESSION_MAX_AGE },
  );

  return {
    ok: true,
  };
});
